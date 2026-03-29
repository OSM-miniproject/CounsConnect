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

// PatientProfileRepository handles patient profile operations with MongoDB
type PatientProfileRepository struct {
    collection *mongo.Collection
}

// CounselorProfileRepository handles counselor profile operations with MongoDB
type CounselorProfileRepository struct {
    collection *mongo.Collection
}

// NewPatientProfileRepository creates a new patient profile repository
func NewPatientProfileRepository(db *mongo.Database) *PatientProfileRepository {
    collection := db.Collection("patient_profiles")
    
    // Create index on user_id
    indexModel := mongo.IndexModel{
        Keys: bson.D{
            {Key: "user_id", Value: 1},
        },
        Options: options.Index().SetUnique(true),
    }
    
    ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
    defer cancel()
    
    _, err := collection.Indexes().CreateOne(ctx, indexModel)
    if err != nil {
        panic(err)
    }
    
    return &PatientProfileRepository{
        collection: collection,
    }
}

// NewCounselorProfileRepository creates a new counselor profile repository
func NewCounselorProfileRepository(db *mongo.Database) *CounselorProfileRepository {
    collection := db.Collection("counselor_profiles")
    
    // Create index on user_id
    indexModel := mongo.IndexModel{
        Keys: bson.D{
            {Key: "user_id", Value: 1},
        },
        Options: options.Index().SetUnique(true),
    }
    
    ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
    defer cancel()
    
    _, err := collection.Indexes().CreateOne(ctx, indexModel)
    if err != nil {
        panic(err)
    }
    
    return &CounselorProfileRepository{
        collection: collection,
    }
}

// FindByUserID finds a patient profile by user ID
func (r *PatientProfileRepository) FindByUserID(userID primitive.ObjectID) (*models.PatientProfile, error) {
    ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
    defer cancel()
    
    var profile models.PatientProfile
    err := r.collection.FindOne(ctx, bson.M{"user_id": userID}).Decode(&profile)
    if err != nil {
        if errors.Is(err, mongo.ErrNoDocuments) {
            return nil, nil
        }
        return nil, err
    }
    
    return &profile, nil
}

// CreatePatientProfile creates a new patient profile
func (r *PatientProfileRepository) CreatePatientProfile(profile models.PatientProfile) (*models.PatientProfile, error) {
    ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
    defer cancel()
    
    profile.CreatedAt = time.Now()
    profile.UpdatedAt = time.Now()
    
    result, err := r.collection.InsertOne(ctx, profile)
    if err != nil {
        return nil, err
    }
    
    profile.ID = result.InsertedID.(primitive.ObjectID)
    return &profile, nil
}

// UpdatePatientProfile updates a patient profile
func (r *PatientProfileRepository) UpdatePatientProfile(userID primitive.ObjectID, update bson.M) (*models.PatientProfile, error) {
    ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
    defer cancel()
    
    update["updated_at"] = time.Now()
    
    _, err := r.collection.UpdateOne(
        ctx,
        bson.M{"user_id": userID},
        bson.M{"$set": update},
    )
    
    if err != nil {
        return nil, err
    }
    
    // Get the updated profile
    return r.FindByUserID(userID)
}

// AddCheckIn adds a check-in to a patient profile
func (r *PatientProfileRepository) AddCheckIn(userID primitive.ObjectID, checkIn models.CheckIn) (*models.PatientProfile, error) {
    ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
    defer cancel()
    
    checkIn.Date = time.Now()
    
    update := bson.M{
        "$push": bson.M{
            "check_ins": checkIn,
        },
        "$set": bson.M{
            "updated_at": time.Now(),
        },
    }
    
    _, err := r.collection.UpdateOne(
        ctx,
        bson.M{"user_id": userID},
        update,
    )
    
    if err != nil {
        return nil, err
    }
    
    // Get the updated profile
    return r.FindByUserID(userID)
}

// AssignCounselorToPatient assigns a counselor to a patient
func (r *PatientProfileRepository) AssignCounselorToPatient(patientUserID primitive.ObjectID, counselorID primitive.ObjectID) (*models.PatientProfile, error) {
    ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
    defer cancel()
    
    update := bson.M{
        "$set": bson.M{
            "assigned_counselor_id": counselorID,
            "updated_at":            time.Now(),
        },
    }
    
    _, err := r.collection.UpdateOne(
        ctx,
        bson.M{"user_id": patientUserID},
        update,
    )
    
    if err != nil {
        return nil, err
    }
    
    // Get the updated profile
    return r.FindByUserID(patientUserID)
}

// FindByUserID finds a counselor profile by user ID
func (r *CounselorProfileRepository) FindByUserID(userID primitive.ObjectID) (*models.CounselorProfile, error) {
    ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
    defer cancel()
    
    var profile models.CounselorProfile
    err := r.collection.FindOne(ctx, bson.M{"user_id": userID}).Decode(&profile)
    if err != nil {
        if errors.Is(err, mongo.ErrNoDocuments) {
            return nil, nil
        }
        return nil, err
    }
    
    return &profile, nil
}

// CreateCounselorProfile creates a new counselor profile
func (r *CounselorProfileRepository) CreateCounselorProfile(profile models.CounselorProfile) (*models.CounselorProfile, error) {
    ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
    defer cancel()
    
    profile.CreatedAt = time.Now()
    profile.UpdatedAt = time.Now()
    
    result, err := r.collection.InsertOne(ctx, profile)
    if err != nil {
        return nil, err
    }
    
    profile.ID = result.InsertedID.(primitive.ObjectID)
    return &profile, nil
}

// UpdateCounselorProfile updates a counselor profile
func (r *CounselorProfileRepository) UpdateCounselorProfile(userID primitive.ObjectID, update bson.M) (*models.CounselorProfile, error) {
    ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
    defer cancel()
    
    update["updated_at"] = time.Now()
    
    _, err := r.collection.UpdateOne(
        ctx,
        bson.M{"user_id": userID},
        bson.M{"$set": update},
    )
    
    if err != nil {
        return nil, err
    }
    
    // Get the updated profile
    return r.FindByUserID(userID)
}

// FindAllPatients retrieves all patient profiles
func (r *PatientProfileRepository) FindAllPatients() ([]*models.PatientProfile, error) {
    ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
    defer cancel()
    
    cursor, err := r.collection.Find(ctx, bson.M{})
    if err != nil {
        return nil, err
    }
    defer cursor.Close(ctx)
    
    var profiles []*models.PatientProfile
    if err := cursor.All(ctx, &profiles); err != nil {
        return nil, err
    }
    
    return profiles, nil
}

// FindAllCounselors retrieves all counselor profiles
func (r *CounselorProfileRepository) FindAllCounselors() ([]*models.CounselorProfile, error) {
    ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
    defer cancel()
    
    cursor, err := r.collection.Find(ctx, bson.M{})
    if err != nil {
        return nil, err
    }
    defer cursor.Close(ctx)
    
    var profiles []*models.CounselorProfile
    if err := cursor.All(ctx, &profiles); err != nil {
        return nil, err
    }
    
    return profiles, nil
}

// FindPatientsByAssignedCounselor retrieves all patients assigned to a specific counselor
func (r *PatientProfileRepository) FindPatientsByAssignedCounselor(counselorID primitive.ObjectID) ([]*models.PatientProfile, error) {
    ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
    defer cancel()
    
    cursor, err := r.collection.Find(ctx, bson.M{"assigned_counselor_id": counselorID})
    if err != nil {
        return nil, err
    }
    defer cursor.Close(ctx)
    
    var profiles []*models.PatientProfile
    if err := cursor.All(ctx, &profiles); err != nil {
        return nil, err
    }
    
    return profiles, nil
}