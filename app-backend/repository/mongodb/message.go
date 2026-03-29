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

// MessageRepository handles message operations with MongoDB
type MessageRepository struct {
    collection *mongo.Collection
}

// NewMessageRepository creates a new message repository
func NewMessageRepository(db *mongo.Database) *MessageRepository {
    collection := db.Collection("messages")

    // Create indexes for efficient queries
    indexModels := []mongo.IndexModel{
        {
            Keys: bson.D{
                {Key: "sender_id", Value: 1},
                {Key: "receiver_id", Value: 1},
            },
        },
        {
            Keys: bson.D{
                {Key: "timestamp", Value: -1},
            },
        },
    }

    ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
    defer cancel()

    _, err := collection.Indexes().CreateMany(ctx, indexModels)
    if err != nil {
        panic(err)
    }

    return &MessageRepository{
        collection: collection,
    }
}

// Create creates a new message
func (r *MessageRepository) Create(message models.Message) (*models.Message, error) {
    ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
    defer cancel()

    message.Timestamp = time.Now()
    message.CreatedAt = time.Now()

    result, err := r.collection.InsertOne(ctx, message)
    if err != nil {
        return nil, err
    }

    message.ID = result.InsertedID.(primitive.ObjectID)
    return &message, nil
}

// FindByID finds a message by ID
func (r *MessageRepository) FindByID(id primitive.ObjectID) (*models.Message, error) {
    ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
    defer cancel()

    var message models.Message
    err := r.collection.FindOne(ctx, bson.M{"_id": id}).Decode(&message)
    if err != nil {
        if errors.Is(err, mongo.ErrNoDocuments) {
            return nil, nil
        }
        return nil, err
    }

    return &message, nil
}

// FindConversation finds all messages between two users
func (r *MessageRepository) FindConversation(userID1, userID2 primitive.ObjectID) ([]*models.Message, error) {
    ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
    defer cancel()

    // Query for messages where either user is sender and the other is receiver
    filter := bson.M{
        "$or": []bson.M{
            {
                "sender_id":   userID1,
                "receiver_id": userID2,
            },
            {
                "sender_id":   userID2,
                "receiver_id": userID1,
            },
        },
    }

    opts := options.Find().SetSort(bson.D{{Key: "timestamp", Value: 1}})
    cursor, err := r.collection.Find(ctx, filter, opts)
    if err != nil {
        return nil, err
    }
    defer cursor.Close(ctx)

    var messages []*models.Message
    if err := cursor.All(ctx, &messages); err != nil {
        return nil, err
    }

    return messages, nil
}

// FindRecentMessages finds the most recent messages for a user
func (r *MessageRepository) FindRecentMessages(userID primitive.ObjectID, limit int64) ([]*models.Message, error) {
    ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
    defer cancel()

    // Query for messages where user is sender or receiver
    filter := bson.M{
        "$or": []bson.M{
            {"sender_id": userID},
            {"receiver_id": userID},
        },
    }

    opts := options.Find().
        SetSort(bson.D{{Key: "timestamp", Value: -1}}).
        SetLimit(limit)

    cursor, err := r.collection.Find(ctx, filter, opts)
    if err != nil {
        return nil, err
    }
    defer cursor.Close(ctx)

    var messages []*models.Message
    if err := cursor.All(ctx, &messages); err != nil {
        return nil, err
    }

    return messages, nil
}

// FindMessagesByUser finds all messages for a user
func (r *MessageRepository) FindMessagesByUser(userID primitive.ObjectID) ([]*models.Message, error) {
    ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
    defer cancel()

    // Query for messages where user is sender or receiver
    filter := bson.M{
        "$or": []bson.M{
            {"sender_id": userID},
            {"receiver_id": userID},
        },
    }

    opts := options.Find().SetSort(bson.D{{Key: "timestamp", Value: -1}})
    cursor, err := r.collection.Find(ctx, filter, opts)
    if err != nil {
        return nil, err
    }
    defer cursor.Close(ctx)

    var messages []*models.Message
    if err := cursor.All(ctx, &messages); err != nil {
        return nil, err
    }

    return messages, nil
}

// FindDistinctConversations finds all distinct conversations for a user
// Returns a list of contact IDs with whom the user has had conversations
func (r *MessageRepository) FindDistinctConversations(userID primitive.ObjectID) ([]primitive.ObjectID, error) {
    ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
    defer cancel()

    // First, find distinct users who received messages from this user
    senderPipeline := bson.A{
        bson.D{{Key: "$match", Value: bson.D{{Key: "sender_id", Value: userID}}}},
        bson.D{{Key: "$group", Value: bson.D{{Key: "_id", Value: "$receiver_id"}}}},
    }

    // Then, find distinct users who sent messages to this user
    receiverPipeline := bson.A{
        bson.D{{Key: "$match", Value: bson.D{{Key: "receiver_id", Value: userID}}}},
        bson.D{{Key: "$group", Value: bson.D{{Key: "_id", Value: "$sender_id"}}}},
    }

    // Execute both pipelines
    senderCursor, err := r.collection.Aggregate(ctx, senderPipeline)
    if err != nil {
        return nil, err
    }
    defer senderCursor.Close(ctx)

    receiverCursor, err := r.collection.Aggregate(ctx, receiverPipeline)
    if err != nil {
        return nil, err
    }
    defer receiverCursor.Close(ctx)

    // Combine results, removing duplicates
    contactsMap := make(map[primitive.ObjectID]bool)

    // Add sender results
    var senderResults []struct {
        ID primitive.ObjectID `bson:"_id"`
    }
    if err := senderCursor.All(ctx, &senderResults); err != nil {
        return nil, err
    }
    for _, result := range senderResults {
        contactsMap[result.ID] = true
    }

    // Add receiver results
    var receiverResults []struct {
        ID primitive.ObjectID `bson:"_id"`
    }
    if err := receiverCursor.All(ctx, &receiverResults); err != nil {
        return nil, err
    }
    for _, result := range receiverResults {
        contactsMap[result.ID] = true
    }

    // Convert map to slice
    contacts := make([]primitive.ObjectID, 0, len(contactsMap))
    for id := range contactsMap {
        contacts = append(contacts, id)
    }

    return contacts, nil
}