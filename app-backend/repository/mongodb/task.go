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

// TaskRepository handles database operations for tasks
type TaskRepository struct {
    collection *mongo.Collection
}

// NewTaskRepository creates a new task repository
func NewTaskRepository(db *mongo.Database) *TaskRepository {
    return &TaskRepository{
        collection: db.Collection("tasks"),
    }
}

// Add this method to your TaskRepository if it doesn't exist

// FindAll retrieves all tasks
func (r *TaskRepository) FindAll() ([]models.Task, error) {
    ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
    defer cancel()

    cursor, err := r.collection.Find(ctx, bson.M{})
    if err != nil {
        return nil, err
    }
    defer cursor.Close(ctx)

    var tasks []models.Task
    if err := cursor.All(ctx, &tasks); err != nil {
        return nil, err
    }

    return tasks, nil
}

// Create creates a new task
func (r *TaskRepository) Create(task *models.Task) (*models.Task, error) {
    ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
    defer cancel()

    // Set creation and update times
    now := time.Now()
    task.CreatedAt = now
    task.UpdatedAt = now

    // Insert task
    result, err := r.collection.InsertOne(ctx, task)
    if err != nil {
        return nil, err
    }

    // Get the ID of the inserted task
    task.ID = result.InsertedID.(primitive.ObjectID)

    return task, nil
}

// FindByID finds a task by ID
func (r *TaskRepository) FindByID(id primitive.ObjectID) (*models.Task, error) {
    ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
    defer cancel()

    var task models.Task
    err := r.collection.FindOne(ctx, bson.M{"_id": id}).Decode(&task)
    if err != nil {
        if err == mongo.ErrNoDocuments {
            return nil, nil
        }
        return nil, err
    }

    return &task, nil
}

// FindByPatientID finds all tasks for a specific patient
func (r *TaskRepository) FindByPatientID(patientID primitive.ObjectID) ([]*models.Task, error) {
    ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
    defer cancel()

    opts := options.Find().SetSort(bson.D{{Key: "deadline", Value: 1}})
    cursor, err := r.collection.Find(ctx, bson.M{"patientId": patientID}, opts)
    if err != nil {
        return nil, err
    }
    defer cursor.Close(ctx)

    var tasks []*models.Task
    if err = cursor.All(ctx, &tasks); err != nil {
        return nil, err
    }

    return tasks, nil
}

// FindByCounselorID finds all tasks created by a specific counselor
func (r *TaskRepository) FindByCounselorID(counselorID primitive.ObjectID) ([]*models.Task, error) {
    ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
    defer cancel()

    opts := options.Find().SetSort(bson.D{{Key: "deadline", Value: 1}})
    cursor, err := r.collection.Find(ctx, bson.M{"counselorId": counselorID}, opts)
    if err != nil {
        return nil, err
    }
    defer cursor.Close(ctx)

    var tasks []*models.Task
    if err = cursor.All(ctx, &tasks); err != nil {
        return nil, err
    }

    return tasks, nil
}

// FindUpcoming finds upcoming tasks for a specific user
func (r *TaskRepository) FindUpcoming(userID primitive.ObjectID, isPatient bool) ([]*models.Task, error) {
    ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
    defer cancel()

    // Set filter based on user role
    filter := bson.M{}
    if isPatient {
        filter["patientId"] = userID
    } else {
        filter["counselorId"] = userID
    }
    
    // Only include tasks with deadlines in the future
    filter["deadline"] = bson.M{"$gt": time.Now()}
    
    opts := options.Find().SetSort(bson.D{{Key: "deadline", Value: 1}}).SetLimit(10)
    cursor, err := r.collection.Find(ctx, filter, opts)
    if err != nil {
        return nil, err
    }
    defer cursor.Close(ctx)

    var tasks []*models.Task
    if err = cursor.All(ctx, &tasks); err != nil {
        return nil, err
    }

    return tasks, nil
}

// Update updates a task
func (r *TaskRepository) Update(id primitive.ObjectID, updates bson.M) (*models.Task, error) {
    ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
    defer cancel()

    // Add updated time
    updates["updatedAt"] = time.Now()

    // Update task
    updateDoc := bson.M{"$set": updates}
    _, err := r.collection.UpdateOne(ctx, bson.M{"_id": id}, updateDoc)
    if err != nil {
        return nil, err
    }

    // Return updated task
    return r.FindByID(id)
}

// UpdateStatus updates the status of a task
func (r *TaskRepository) UpdateStatus(id primitive.ObjectID, status string) (*models.Task, error) {
    return r.Update(id, bson.M{"status": status})
}

// AddFeedback adds or updates feedback for a task
func (r *TaskRepository) AddFeedback(id primitive.ObjectID, feedback string) (*models.Task, error) {
    return r.Update(id, bson.M{"feedback": feedback})
}

// Delete deletes a task
func (r *TaskRepository) Delete(id primitive.ObjectID) error {
    ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
    defer cancel()

    result, err := r.collection.DeleteOne(ctx, bson.M{"_id": id})
    if err != nil {
        return err
    }

    if result.DeletedCount == 0 {
        return errors.New("task not found")
    }

    return nil
}

// FindAll finds all tasks
// func (r *TaskRepository) FindAll() ([]*models.Task, error) {
//     ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
//     defer cancel()

//     opts := options.Find().SetSort(bson.D{{Key: "deadline", Value: 1}})
//     cursor, err := r.collection.Find(ctx, bson.M{}, opts)
//     if err != nil {
//         return nil, err
//     }
//     defer cursor.Close(ctx)

//     var tasks []*models.Task
//     if err = cursor.All(ctx, &tasks); err != nil {
//         return nil, err
//     }

//     return tasks, nil
// }