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

// ResourceRepository handles resource operations with MongoDB
type ResourceRepository struct {
    collection *mongo.Collection
}

// NewResourceRepository creates a new resource repository
func NewResourceRepository(db *mongo.Database) *ResourceRepository {
    collection := db.Collection("resources")

    // Create indexes
    indexModels := []mongo.IndexModel{
        {
            Keys: bson.D{
                {Key: "uploaded_by", Value: 1},
            },
        },
        {
            Keys: bson.D{
                {Key: "type", Value: 1},
            },
        },
    }

    ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
    defer cancel()

    _, err := collection.Indexes().CreateMany(ctx, indexModels)
    if err != nil {
        panic(err)
    }

    return &ResourceRepository{
        collection: collection,
    }
}

// Create creates a new resource
func (r *ResourceRepository) Create(resource models.Resource) (*models.Resource, error) {
    ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
    defer cancel()

    resource.CreatedAt = time.Now()
    resource.UpdatedAt = time.Now()

    result, err := r.collection.InsertOne(ctx, resource)
    if err != nil {
        return nil, err
    }

    resource.ID = result.InsertedID.(primitive.ObjectID)
    return &resource, nil
}

// FindByID finds a resource by ID
func (r *ResourceRepository) FindByID(id primitive.ObjectID) (*models.Resource, error) {
    ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
    defer cancel()

    var resource models.Resource
    err := r.collection.FindOne(ctx, bson.M{"_id": id}).Decode(&resource)
    if err != nil {
        if errors.Is(err, mongo.ErrNoDocuments) {
            return nil, nil
        }
        return nil, err
    }

    return &resource, nil
}

// Update updates a resource
func (r *ResourceRepository) Update(id primitive.ObjectID, update bson.M) (*models.Resource, error) {
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

    // Get the updated resource
    return r.FindByID(id)
}

// Delete deletes a resource
func (r *ResourceRepository) Delete(id primitive.ObjectID) error {
    ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
    defer cancel()

    result, err := r.collection.DeleteOne(ctx, bson.M{"_id": id})
    if err != nil {
        return err
    }

    if result.DeletedCount == 0 {
        return errors.New("resource not found")
    }

    return nil
}

// FindByUploader finds resources by uploader
func (r *ResourceRepository) FindByUploader(uploaderID primitive.ObjectID) ([]*models.Resource, error) {
    ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
    defer cancel()

    opts := options.Find().SetSort(bson.D{{Key: "created_at", Value: -1}})
    cursor, err := r.collection.Find(ctx, bson.M{"uploaded_by": uploaderID}, opts)
    if err != nil {
        return nil, err
    }
    defer cursor.Close(ctx)

    var resources []*models.Resource
    if err := cursor.All(ctx, &resources); err != nil {
        return nil, err
    }

    return resources, nil
}

// FindByType finds resources by type
func (r *ResourceRepository) FindByType(resourceType string) ([]*models.Resource, error) {
    ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
    defer cancel()

    opts := options.Find().SetSort(bson.D{{Key: "created_at", Value: -1}})
    cursor, err := r.collection.Find(ctx, bson.M{"type": resourceType}, opts)
    if err != nil {
        return nil, err
    }
    defer cursor.Close(ctx)

    var resources []*models.Resource
    if err := cursor.All(ctx, &resources); err != nil {
        return nil, err
    }

    return resources, nil
}

// FindAll finds all resources
func (r *ResourceRepository) FindAll() ([]*models.Resource, error) {
    ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
    defer cancel()

    opts := options.Find().SetSort(bson.D{{Key: "created_at", Value: -1}})
    cursor, err := r.collection.Find(ctx, bson.M{}, opts)
    if err != nil {
        return nil, err
    }
    defer cursor.Close(ctx)

    var resources []*models.Resource
    if err := cursor.All(ctx, &resources); err != nil {
        return nil, err
    }

    return resources, nil
}

// AssignResourcesToPatient assigns resources to a patient
func (r *ResourceRepository) AssignResourcesToPatient(resourceID primitive.ObjectID, patientID primitive.ObjectID) (*models.Resource, error) {
    ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
    defer cancel()

    update := bson.M{
        "$addToSet": bson.M{"assigned_to": patientID},
        "$set":      bson.M{"updated_at": time.Now()},
    }

    _, err := r.collection.UpdateOne(ctx, bson.M{"_id": resourceID}, update)
    if err != nil {
        return nil, err
    }

    // Get the updated resource
    return r.FindByID(resourceID)
}

// FindAssignedToPatient finds resources assigned to a patient
func (r *ResourceRepository) FindAssignedToPatient(patientID primitive.ObjectID) ([]*models.Resource, error) {
    ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
    defer cancel()

    opts := options.Find().SetSort(bson.D{{Key: "created_at", Value: -1}})
    cursor, err := r.collection.Find(ctx, bson.M{"assigned_to": patientID}, opts)
    if err != nil {
        return nil, err
    }
    defer cursor.Close(ctx)

    var resources []*models.Resource
    if err := cursor.All(ctx, &resources); err != nil {
        return nil, err
    }

    return resources, nil
}