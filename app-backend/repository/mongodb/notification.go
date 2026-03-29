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

// NotificationRepository handles notification operations with MongoDB
type NotificationRepository struct {
    collection *mongo.Collection
}

// NewNotificationRepository creates a new notification repository
func NewNotificationRepository(db *mongo.Database) *NotificationRepository {
    collection := db.Collection("notifications")

    // Create indexes for efficient queries
    indexModels := []mongo.IndexModel{
        {
            Keys: bson.D{
                {Key: "user_id", Value: 1},
            },
        },
        {
            Keys: bson.D{
                {Key: "timestamp", Value: -1},
            },
        },
        {
            Keys: bson.D{
                {Key: "read", Value: 1},
            },
        },
    }

    ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
    defer cancel()

    _, err := collection.Indexes().CreateMany(ctx, indexModels)
    if err != nil {
        panic(err)
    }

    return &NotificationRepository{
        collection: collection,
    }
}

// Create creates a new notification
func (r *NotificationRepository) Create(notification models.Notification) (*models.Notification, error) {
    ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
    defer cancel()

    notification.Timestamp = time.Now()
    notification.Read = false
    notification.CreatedAt = time.Now()

    result, err := r.collection.InsertOne(ctx, notification)
    if err != nil {
        return nil, err
    }

    notification.ID = result.InsertedID.(primitive.ObjectID)
    return &notification, nil
}

// FindByID finds a notification by ID
func (r *NotificationRepository) FindByID(id primitive.ObjectID) (*models.Notification, error) {
    ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
    defer cancel()

    var notification models.Notification
    err := r.collection.FindOne(ctx, bson.M{"_id": id}).Decode(&notification)
    if err != nil {
        if errors.Is(err, mongo.ErrNoDocuments) {
            return nil, nil
        }
        return nil, err
    }

    return &notification, nil
}

// MarkAsRead marks a notification as read
func (r *NotificationRepository) MarkAsRead(id primitive.ObjectID, read bool) (*models.Notification, error) {
    ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
    defer cancel()

    update := bson.M{
        "$set": bson.M{
            "read": read,
        },
    }

    _, err := r.collection.UpdateOne(ctx, bson.M{"_id": id}, update)
    if err != nil {
        return nil, err
    }

    // Get the updated notification
    return r.FindByID(id)
}

// Delete deletes a notification
func (r *NotificationRepository) Delete(id primitive.ObjectID) error {
    ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
    defer cancel()

    result, err := r.collection.DeleteOne(ctx, bson.M{"_id": id})
    if err != nil {
        return err
    }

    if result.DeletedCount == 0 {
        return errors.New("notification not found")
    }

    return nil
}

// FindByUserID finds all notifications for a user
func (r *NotificationRepository) FindByUserID(userID primitive.ObjectID) ([]*models.Notification, error) {
    ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
    defer cancel()

    opts := options.Find().
        SetSort(bson.D{{Key: "timestamp", Value: -1}})

    cursor, err := r.collection.Find(ctx, bson.M{"user_id": userID}, opts)
    if err != nil {
        return nil, err
    }
    defer cursor.Close(ctx)

    var notifications []*models.Notification
    if err := cursor.All(ctx, &notifications); err != nil {
        return nil, err
    }

    return notifications, nil
}

// FindUnreadByUserID finds all unread notifications for a user
func (r *NotificationRepository) FindUnreadByUserID(userID primitive.ObjectID) ([]*models.Notification, error) {
    ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
    defer cancel()

    opts := options.Find().
        SetSort(bson.D{{Key: "timestamp", Value: -1}})

    cursor, err := r.collection.Find(ctx, bson.M{
        "user_id": userID,
        "read":    false,
    }, opts)
    if err != nil {
        return nil, err
    }
    defer cursor.Close(ctx)

    var notifications []*models.Notification
    if err := cursor.All(ctx, &notifications); err != nil {
        return nil, err
    }

    return notifications, nil
}

// MarkAllAsRead marks all notifications for a user as read
func (r *NotificationRepository) MarkAllAsRead(userID primitive.ObjectID) error {
    ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
    defer cancel()

    update := bson.M{
        "$set": bson.M{
            "read": true,
        },
    }

    _, err := r.collection.UpdateMany(ctx, bson.M{
        "user_id": userID,
        "read":    false,
    }, update)

    return err
}

// CountUnreadByUserID counts unread notifications for a user
func (r *NotificationRepository) CountUnreadByUserID(userID primitive.ObjectID) (int64, error) {
    ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
    defer cancel()

    count, err := r.collection.CountDocuments(ctx, bson.M{
        "user_id": userID,
        "read":    false,
    })

    return count, err
}
