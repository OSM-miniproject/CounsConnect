package models

import (
    "time"

    "go.mongodb.org/mongo-driver/bson/primitive"
)

// PatientProfile represents the profile for a patient user
type PatientProfile struct {
    ID                  primitive.ObjectID `json:"id" bson:"_id,omitempty"`
    UserID              primitive.ObjectID `json:"user_id" bson:"user_id"`
    AssignedCounselorID primitive.ObjectID `json:"assigned_counselor_id,omitempty" bson:"assigned_counselor_id,omitempty"`
    TherapyPlan         string             `json:"therapy_plan" bson:"therapy_plan"`
    CheckIns            []CheckIn          `json:"check_ins" bson:"check_ins"`
    EmergencyContact    EmergencyContact   `json:"emergency_contact" bson:"emergency_contact"`
    CreatedAt           time.Time          `json:"created_at" bson:"created_at"`
    UpdatedAt           time.Time          `json:"updated_at" bson:"updated_at"`
}

// CheckIn represents a patient's mood and notes on a specific date
type CheckIn struct {
    Date  time.Time `json:"date" bson:"date"`
    Mood  string    `json:"mood" bson:"mood"`
    Notes string    `json:"notes" bson:"notes"`
}

// EmergencyContact represents emergency contact information
type EmergencyContact struct {
    Name  string `json:"name" bson:"name"`
    Phone string `json:"phone" bson:"phone"`
}

// CounselorProfile represents the profile for a counselor user
type CounselorProfile struct {
    ID           primitive.ObjectID `json:"id" bson:"_id,omitempty"`
    UserID       primitive.ObjectID `json:"user_id" bson:"user_id"`
    Specialties  []string           `json:"specialties" bson:"specialties"`
    Availability []Availability     `json:"availability" bson:"availability"`
    CreatedAt    time.Time          `json:"created_at" bson:"created_at"`
    UpdatedAt    time.Time          `json:"updated_at" bson:"updated_at"`
}

// Availability represents a counselor's available time slot
type Availability struct {
    Day       string `json:"day" bson:"day"`
    StartTime string `json:"start_time" bson:"start_time"`
    EndTime   string `json:"end_time" bson:"end_time"`
}

// PatientProfileInput is used to create or update a patient profile
type PatientProfileInput struct {
    TherapyPlan      string           `json:"therapy_plan"`
    EmergencyContact EmergencyContact `json:"emergency_contact" binding:"required"`
}

// CounselorProfileInput is used to create or update a counselor profile
type CounselorProfileInput struct {
    Specialties  []string       `json:"specialties" binding:"required"`
    Availability []Availability `json:"availability" binding:"required"`
}

// CheckInInput represents input for adding a new check-in
type CheckInInput struct {
    Mood  string `json:"mood" binding:"required"`
    Notes string `json:"notes"`
}

// AssignCounselorInput represents input for assigning a counselor to a patient
type AssignCounselorInput struct {
    CounselorID string `json:"counselor_id" binding:"required"`
}