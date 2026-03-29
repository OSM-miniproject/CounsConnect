package mongodb

import (
    "context"
    "errors"
    "strconv" // Import strconv
    "time"

    "github.com/thundersp/backend/models"
    "go.mongodb.org/mongo-driver/bson"
    "go.mongodb.org/mongo-driver/bson/primitive"
    "go.mongodb.org/mongo-driver/mongo"
    "go.mongodb.org/mongo-driver/mongo/options"
)

// ScheduleRepository handles schedule operations with MongoDB
type ScheduleRepository struct {
    collection *mongo.Collection
}

// NewScheduleRepository creates a new schedule repository
func NewScheduleRepository(db *mongo.Database) *ScheduleRepository {
    collection := db.Collection("schedules")

    // Create unique index on date
    indexModel := mongo.IndexModel{
        Keys: bson.D{
            {Key: "date", Value: 1},
        },
        Options: options.Index().SetUnique(true),
    }

    ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
    defer cancel()

    _, err := collection.Indexes().CreateOne(ctx, indexModel)
    if err != nil {
        // Log or handle index creation error appropriately
        // For now, we panic as it's critical for functionality
        panic(err)
    }

    return &ScheduleRepository{
        collection: collection,
    }
}

// FindByDate finds a schedule for a specific date
func (r *ScheduleRepository) FindByDate(date time.Time) (*models.Schedule, error) {
    ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
    defer cancel()

    // Format the date to ignore time part for comparison
    startOfDay := time.Date(date.Year(), date.Month(), date.Day(), 0, 0, 0, 0, date.Location())
    endOfDay := time.Date(date.Year(), date.Month(), date.Day(), 23, 59, 59, 999999999, date.Location())

    var schedule models.Schedule
    err := r.collection.FindOne(ctx, bson.M{
        "date": bson.M{
            "$gte": startOfDay,
            "$lte": endOfDay,
        },
    }).Decode(&schedule)

    if err != nil {
        if errors.Is(err, mongo.ErrNoDocuments) {
            return nil, nil // Return nil, nil if no document found
        }
        return nil, err // Return other errors
    }

    return &schedule, nil
}

// Create creates a new schedule
func (r *ScheduleRepository) Create(schedule models.Schedule) (*models.Schedule, error) {
    ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
    defer cancel()

    schedule.CreatedAt = time.Now()
    schedule.UpdatedAt = time.Now()

    result, err := r.collection.InsertOne(ctx, schedule)
    if err != nil {
        return nil, err
    }

    schedule.ID = result.InsertedID.(primitive.ObjectID)
    return &schedule, nil
}

// FindAll retrieves all schedules
func (r *ScheduleRepository) FindAll() ([]*models.Schedule, error) {
    ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
    defer cancel()

    opts := options.Find().SetSort(bson.D{{Key: "date", Value: 1}})
    cursor, err := r.collection.Find(ctx, bson.M{}, opts)
    if err != nil {
        return nil, err
    }
    defer cursor.Close(ctx)

    var schedules []*models.Schedule
    if err := cursor.All(ctx, &schedules); err != nil {
        return nil, err
    }

    return schedules, nil
}

// FindUpcoming retrieves upcoming schedules from today
func (r *ScheduleRepository) FindUpcoming() ([]*models.Schedule, error) {
    ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
    defer cancel()

    today := time.Now()
    startOfDay := time.Date(today.Year(), today.Month(), today.Day(), 0, 0, 0, 0, today.Location())

    opts := options.Find().SetSort(bson.D{{Key: "date", Value: 1}})
    cursor, err := r.collection.Find(ctx, bson.M{
        "date": bson.M{"$gte": startOfDay},
    }, opts)

    if err != nil {
        return nil, err
    }
    defer cursor.Close(ctx)

    var schedules []*models.Schedule
    if err := cursor.All(ctx, &schedules); err != nil {
        return nil, err
    }

    return schedules, nil
}

// UpdateTimeSlot updates a specific time slot in a schedule
func (r *ScheduleRepository) UpdateTimeSlot(scheduleID primitive.ObjectID, slotIndex int, timeSlot models.TimeSlot) (*models.Schedule, error) {
    ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
    defer cancel()

    // Use strconv.Itoa to correctly format the index
    updatePath := "time_slots." + strconv.Itoa(slotIndex)
    update := bson.M{
        "$set": bson.M{
            updatePath:   timeSlot,
            "updated_at": time.Now(),
        },
    }

    _, err := r.collection.UpdateOne(
        ctx,
        bson.M{"_id": scheduleID},
        update,
    )

    if err != nil {
        return nil, err
    }

    // Get the updated schedule
    var schedule models.Schedule
    err = r.collection.FindOne(ctx, bson.M{"_id": scheduleID}).Decode(&schedule)
    if err != nil {
        return nil, err
    }

    return &schedule, nil
}

// BookTimeSlot books a time slot for a user
func (r *ScheduleRepository) BookTimeSlot(date time.Time, startTime time.Time, userID primitive.ObjectID, username string) (*models.Schedule, error) {
    ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
    defer cancel()

    // Find the schedule for the given date
    schedule, err := r.FindByDate(date)
    if err != nil {
        return nil, err
    }

    if schedule == nil {
        return nil, errors.New("schedule not found for the specified date")
    }

    // Find the time slot index
    slotIndex := -1
    for i, slot := range schedule.TimeSlots {
        // Compare time components only, ignoring potential location differences if any
        if slot.StartTime.Year() == startTime.Year() &&
            slot.StartTime.Month() == startTime.Month() &&
            slot.StartTime.Day() == startTime.Day() &&
            slot.StartTime.Hour() == startTime.Hour() &&
            slot.StartTime.Minute() == startTime.Minute() {
            slotIndex = i
            break
        }
    }

    if slotIndex == -1 {
        return nil, errors.New("time slot not found for the specified start time")
    }

    // Check if the slot is already booked
    if !schedule.TimeSlots[slotIndex].UserID.IsZero() {
        // Check if it's booked by the same user trying to book again
        if schedule.TimeSlots[slotIndex].UserID == userID {
            return nil, errors.New("you have already booked this time slot")
        }
        return nil, errors.New("time slot already booked by another user")
    }

    // Update the time slot using the correct index format
    updatePathUserID := "time_slots." + strconv.Itoa(slotIndex) + ".user_id"
    updatePathUsername := "time_slots." + strconv.Itoa(slotIndex) + ".username"
    update := bson.M{
        "$set": bson.M{
            updatePathUserID:   userID,
            updatePathUsername: username,
            "updated_at":       time.Now(),
        },
    }

    _, err = r.collection.UpdateOne(
        ctx,
        bson.M{"_id": schedule.ID},
        update,
    )

    if err != nil {
        return nil, err
    }

    // Get the updated schedule to return
    updatedSchedule, err := r.FindByDate(date)
    if err != nil {
        // Log this error, but the update likely succeeded.
        // Returning the original schedule might be misleading.
        // Consider returning nil, err or handling differently.
        return nil, errors.New("booking successful, but failed to retrieve updated schedule: " + err.Error())
    }
    return updatedSchedule, nil
}

// CancelBooking cancels a booking for a user
func (r *ScheduleRepository) CancelBooking(date time.Time, startTime time.Time, userID primitive.ObjectID) (*models.Schedule, error) {
    ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
    defer cancel()

    // Find the schedule for the given date
    schedule, err := r.FindByDate(date)
    if err != nil {
        return nil, err
    }

    if schedule == nil {
        return nil, errors.New("schedule not found for the specified date")
    }

    // Find the time slot index
    slotIndex := -1
    for i, slot := range schedule.TimeSlots {
        // Compare time components only
        if slot.StartTime.Year() == startTime.Year() &&
            slot.StartTime.Month() == startTime.Month() &&
            slot.StartTime.Day() == startTime.Day() &&
            slot.StartTime.Hour() == startTime.Hour() &&
            slot.StartTime.Minute() == startTime.Minute() {
            slotIndex = i
            break
        }
    }

    if slotIndex == -1 {
        return nil, errors.New("time slot not found for the specified start time")
    }

    // Check if the slot is booked by this user
    if schedule.TimeSlots[slotIndex].UserID != userID {
        return nil, errors.New("time slot not booked by this user or already available")
    }

    // Update the time slot to remove user info
    updatePathUserID := "time_slots." + strconv.Itoa(slotIndex) + ".user_id"
    updatePathUsername := "time_slots." + strconv.Itoa(slotIndex) + ".username"
    update := bson.M{
        "$set": bson.M{
            updatePathUserID:   primitive.NilObjectID, // Set back to nil ObjectID
            updatePathUsername: "",                    // Set back to empty string
            "updated_at":       time.Now(),
        },
    }

    _, err = r.collection.UpdateOne(
        ctx,
        bson.M{"_id": schedule.ID},
        update,
    )

    if err != nil {
        return nil, err
    }

    // Get the updated schedule to return
    updatedSchedule, err := r.FindByDate(date)
    if err != nil {
        return nil, errors.New("cancellation successful, but failed to retrieve updated schedule: " + err.Error())
    }
    return updatedSchedule, nil
}

// GetDB returns the MongoDB database reference
// This function seems misplaced in ScheduleRepository, it should belong to UserRepository
// or be handled differently (e.g., passing db reference directly).
// Assuming it's needed here for now based on previous context.
func (r *ScheduleRepository) GetDB() *mongo.Database {
    return r.collection.Database()
}