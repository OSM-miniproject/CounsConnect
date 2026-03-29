package mongodb

import (
    "context"
    "errors"
    "time"

    "github.com/thundersp/backend/models"
    "go.mongodb.org/mongo-driver/bson"
    "go.mongodb.org/mongo-driver/bson/primitive"
    "go.mongodb.org/mongo-driver/mongo"
    "go.mongodb.org/mongo-driver/mongo/options"
)

// AppointmentRepository handles appointment operations with MongoDB
type AppointmentRepository struct {
    collection *mongo.Collection
}

// NewAppointmentRepository creates a new appointment repository
func NewAppointmentRepository(db *mongo.Database) *AppointmentRepository {
    collection := db.Collection("appointments")
    
    // Create index on date fields
    indexModel := mongo.IndexModel{
        Keys: bson.D{
            {Key: "start_time", Value: 1},
        },
        Options: options.Index().SetUnique(false),
    }
    
    ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
    defer cancel()
    
    _, err := collection.Indexes().CreateOne(ctx, indexModel)
    if err != nil {
        panic(err)
    }
    
    return &AppointmentRepository{
        collection: collection,
    }
}

// Create creates a new appointment
func (r *AppointmentRepository) Create(appointment models.Appointment) (*models.Appointment, error) {
    ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
    defer cancel()
    
    // Check if counselor already has an appointment at this time
    count, err := r.collection.CountDocuments(ctx, bson.M{
        "counselor_id": appointment.CounselorID,
        "$or": []bson.M{
            {
                "start_time": bson.M{
                    "$lt": appointment.EndTime,
                },
                "end_time": bson.M{
                    "$gt": appointment.StartTime,
                },
            },
        },
    })
    
    if err != nil {
        return nil, err
    }
    
    if count > 0 {
        return nil, errors.New("counselor already has an appointment at this time slot")
    }
    
    appointment.CreatedAt = time.Now()
    appointment.UpdatedAt = time.Now()
    
    result, err := r.collection.InsertOne(ctx, appointment)
    if err != nil {
        return nil, err
    }
    
    appointment.ID = result.InsertedID.(primitive.ObjectID)
    return &appointment, nil
}

// FindByID finds an appointment by ID
func (r *AppointmentRepository) FindByID(id primitive.ObjectID) (*models.Appointment, error) {
    ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
    defer cancel()
    
    var appointment models.Appointment
    err := r.collection.FindOne(ctx, bson.M{"_id": id}).Decode(&appointment)
    if err != nil {
        if errors.Is(err, mongo.ErrNoDocuments) {
            return nil, nil
        }
        return nil, err
    }
    
    return &appointment, nil
}

// Update updates an appointment
func (r *AppointmentRepository) Update(id primitive.ObjectID, update bson.M) (*models.Appointment, error) {
    ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
    defer cancel()
    
    update["updated_at"] = time.Now()
    
    _, err := r.collection.UpdateOne(
        ctx,
        bson.M{"_id": id},
        bson.M{"$set": update},
    )
    
    if err != nil {
        return nil, err
    }
    
    // Get the updated appointment
    return r.FindByID(id)
}

// Delete deletes an appointment
func (r *AppointmentRepository) Delete(id primitive.ObjectID) error {
    ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
    defer cancel()
    
    result, err := r.collection.DeleteOne(ctx, bson.M{"_id": id})
    if err != nil {
        return err
    }
    
    if result.DeletedCount == 0 {
        return errors.New("appointment not found")
    }
    
    return nil
}

// FindByCounselorID finds all appointments for a specific counselor
func (r *AppointmentRepository) FindByCounselorID(counselorID primitive.ObjectID) ([]*models.Appointment, error) {
    ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
    defer cancel()
    
    opts := options.Find().SetSort(bson.D{{Key: "start_time", Value: 1}})
    cursor, err := r.collection.Find(ctx, bson.M{"counselor_id": counselorID}, opts)
    if err != nil {
        return nil, err
    }
    defer cursor.Close(ctx)
    
    var appointments []*models.Appointment
    if err := cursor.All(ctx, &appointments); err != nil {
        return nil, err
    }
    
    return appointments, nil
}

// FindByPatientID finds all appointments for a specific patient
func (r *AppointmentRepository) FindByPatientID(patientID primitive.ObjectID) ([]*models.Appointment, error) {
    ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
    defer cancel()
    
    opts := options.Find().SetSort(bson.D{{Key: "start_time", Value: 1}})
    cursor, err := r.collection.Find(ctx, bson.M{"patient_id": patientID}, opts)
    if err != nil {
        return nil, err
    }
    defer cursor.Close(ctx)
    
    var appointments []*models.Appointment
    if err := cursor.All(ctx, &appointments); err != nil {
        return nil, err
    }
    
    return appointments, nil
}

// FindUpcoming finds all upcoming appointments
func (r *AppointmentRepository) FindUpcoming() ([]*models.Appointment, error) {
    ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
    defer cancel()
    
    now := time.Now()
    
    opts := options.Find().SetSort(bson.D{{Key: "start_time", Value: 1}})
    cursor, err := r.collection.Find(ctx, bson.M{
        "start_time": bson.M{"$gt": now},
    }, opts)
    
    if err != nil {
        return nil, err
    }
    defer cursor.Close(ctx)
    
    var appointments []*models.Appointment
    if err := cursor.All(ctx, &appointments); err != nil {
        return nil, err
    }
    
    return appointments, nil
}

// FindUpcomingByCounselorID finds all upcoming appointments for a specific counselor
func (r *AppointmentRepository) FindUpcomingByCounselorID(counselorID primitive.ObjectID) ([]*models.Appointment, error) {
    ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
    defer cancel()
    
    now := time.Now()
    
    opts := options.Find().SetSort(bson.D{{Key: "start_time", Value: 1}})
    cursor, err := r.collection.Find(ctx, bson.M{
        "counselor_id": counselorID,
        "start_time":   bson.M{"$gt": now},
    }, opts)
    
    if err != nil {
        return nil, err
    }
    defer cursor.Close(ctx)
    
    var appointments []*models.Appointment
    if err := cursor.All(ctx, &appointments); err != nil {
        return nil, err
    }
    
    return appointments, nil
}

// FindUpcomingByPatientID finds all upcoming appointments for a specific patient
func (r *AppointmentRepository) FindUpcomingByPatientID(patientID primitive.ObjectID) ([]*models.Appointment, error) {
    ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
    defer cancel()
    
    now := time.Now()
    
    opts := options.Find().SetSort(bson.D{{Key: "start_time", Value: 1}})
    cursor, err := r.collection.Find(ctx, bson.M{
        "patient_id": patientID,
        "start_time": bson.M{"$gt": now},
    }, opts)
    
    if err != nil {
        return nil, err
    }
    defer cursor.Close(ctx)
    
    var appointments []*models.Appointment
    if err := cursor.All(ctx, &appointments); err != nil {
        return nil, err
    }
    
    return appointments, nil
}

// UpdateStatus updates the status of an appointment
func (r *AppointmentRepository) UpdateStatus(id primitive.ObjectID, status string) (*models.Appointment, error) {
    ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
    defer cancel()
    
    update := bson.M{
        "status":     status,
        "updated_at": time.Now(),
    }
    
    _, err := r.collection.UpdateOne(
        ctx,
        bson.M{"_id": id},
        bson.M{"$set": update},
    )
    
    if err != nil {
        return nil, err
    }
    
    // Get the updated appointment
    return r.FindByID(id)
}