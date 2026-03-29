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

// UserRepository handles user operations with MongoDB
type UserRepository struct {
    collection *mongo.Collection
}

// NewUserRepository creates a new user repository
func NewUserRepository(db *mongo.Database) *UserRepository {
    collection := db.Collection("users")
    
    // Create unique indexes
    emailIndex := mongo.IndexModel{
        Keys: bson.D{
            {Key: "email", Value: 1},
        },
        Options: options.Index().SetUnique(true),
    }
    
    // Drop any existing uid index that's causing issues
    dropUidIndex := true
    if dropUidIndex {
        ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
        defer cancel()
        collection.Indexes().DropOne(ctx, "uid_1")
    }
    
    ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
    defer cancel()
    
    _, err := collection.Indexes().CreateOne(ctx, emailIndex)
    if err != nil {
        panic(err)
    }
    
    return &UserRepository{
        collection: collection,
    }
}

// ConnectMongoDB establishes connection to MongoDB
func ConnectMongoDB(uri string) (*mongo.Client, error) {
    ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
    defer cancel()
    
    clientOptions := options.Client().ApplyURI(uri)
    client, err := mongo.Connect(ctx, clientOptions)
    if err != nil {
        return nil, err
    }
    
    // Ping the database to verify connection
    if err = client.Ping(ctx, nil); err != nil {
        return nil, err
    }
    
    return client, nil
}

// FindByEmail finds a user by email
func (r *UserRepository) FindByEmail(email string) (*models.User, error) {
    ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
    defer cancel()
    
    var user models.User
    err := r.collection.FindOne(ctx, bson.M{"email": email}).Decode(&user)
    if err != nil {
        if errors.Is(err, mongo.ErrNoDocuments) {
            return nil, nil
        }
        return nil, err
    }
    
    return &user, nil
}

// Create creates a new user
func (r *UserRepository) Create(user models.User) (*models.User, error) {
    ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
    defer cancel()
    
    user.CreatedAt = time.Now()
    user.UpdatedAt = time.Now()
    
    result, err := r.collection.InsertOne(ctx, user)
    if err != nil {
        return nil, err
    }
    
    user.ID = result.InsertedID.(primitive.ObjectID)
    return &user, nil
}

// FindByID finds a user by ID
func (r *UserRepository) FindByID(id primitive.ObjectID) (*models.User, error) {
    ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
    defer cancel()
    
    var user models.User
    err := r.collection.FindOne(ctx, bson.M{"_id": id}).Decode(&user)
    if err != nil {
        if errors.Is(err, mongo.ErrNoDocuments) {
            return nil, nil
        }
        return nil, err
    }
    
    return &user, nil
}

// UpdateProfile updates a user's profile information
func (r *UserRepository) UpdateProfile(id primitive.ObjectID, profile models.ProfileUpdateInput) (*models.User, error) {
    ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
    defer cancel()
    
    update := bson.M{
        "$set": bson.M{
            "name":          profile.Name,
            "phone_number":  profile.PhoneNumber,
            "place_of_stay": profile.PlaceOfStay,
            "updated_at":    time.Now(),
        },
    }
    
    _, err := r.collection.UpdateOne(
        ctx,
        bson.M{"_id": id},
        update,
    )
    
    if err != nil {
        return nil, err
    }
    
    // Get the updated user
    return r.FindByID(id)
}

// GetDB returns the MongoDB database reference
func (r *UserRepository) GetDB() *mongo.Database {
    return r.collection.Database()
}

// FindAll retrieves all users
func (r *UserRepository) FindAll() ([]*models.User, error) {
    ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
    defer cancel()
    
    cursor, err := r.collection.Find(ctx, bson.M{})
    if err != nil {
        return nil, err
    }
    defer cursor.Close(ctx)
    
    var users []*models.User
    if err := cursor.All(ctx, &users); err != nil {
        return nil, err
    }
    
    return users, nil
}

// FindByRole retrieves all users with a specific role
func (r *UserRepository) FindByRole(role string) ([]*models.User, error) {
    ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
    defer cancel()
    
    cursor, err := r.collection.Find(ctx, bson.M{"role": role})
    if err != nil {
        return nil, err
    }
    defer cursor.Close(ctx)
    
    var users []*models.User
    if err := cursor.All(ctx, &users); err != nil {
        return nil, err
    }
    
    return users, nil
}

// Update updates a user
func (r *UserRepository) Update(id primitive.ObjectID, update bson.M) (*models.User, error) {
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
    
    // Get the updated user
    return r.FindByID(id)
}

// Delete deletes a user
func (r *UserRepository) Delete(id primitive.ObjectID) error {
    ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
    defer cancel()
    
    result, err := r.collection.DeleteOne(ctx, bson.M{"_id": id})
    if err != nil {
        return err
    }
    
    if result.DeletedCount == 0 {
        return errors.New("user not found")
    }
    
    return nil
}