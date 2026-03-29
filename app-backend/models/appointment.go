package models

import (
    "time"

    "go.mongodb.org/mongo-driver/bson/primitive"
)

// Appointment represents a counseling appointment
type Appointment struct {
    ID          primitive.ObjectID `json:"id" bson:"_id,omitempty"`
    CounselorID primitive.ObjectID `json:"counselor_id" bson:"counselor_id"`
    PatientID   primitive.ObjectID `json:"patient_id" bson:"patient_id"`
    StartTime   time.Time          `json:"start_time" bson:"start_time"`
    EndTime     time.Time          `json:"end_time" bson:"end_time"`
    Status      string             `json:"status" bson:"status"` // "pending", "confirmed", "completed", "cancelled"
    Location    string             `json:"location" bson:"location"` // "video", "in-person"
    Notes       string             `json:"notes" bson:"notes"`
    CreatedAt   time.Time          `json:"created_at" bson:"created_at"`
    UpdatedAt   time.Time          `json:"updated_at" bson:"updated_at"`
}

// AppointmentInput is used to create a new appointment
type AppointmentInput struct {
    PatientID string    `json:"patient_id" binding:"required"`
    StartTime time.Time `json:"start_time" binding:"required"`
    EndTime   time.Time `json:"end_time" binding:"required"`
    Location  string    `json:"location" binding:"required,oneof=video in-person"`
    Notes     string    `json:"notes"`
}

// AppointmentUpdateInput is used to update an existing appointment
type AppointmentUpdateInput struct {
    StartTime time.Time `json:"start_time"`
    EndTime   time.Time `json:"end_time"`
    Status    string    `json:"status" binding:"omitempty,oneof=pending confirmed completed cancelled"`
    Location  string    `json:"location" binding:"omitempty,oneof=video in-person"`
    Notes     string    `json:"notes"`
}

// AppointmentStatusUpdateInput is used to update the status of an appointment
type AppointmentStatusUpdateInput struct {
    Status string `json:"status" binding:"required,oneof=pending confirmed completed cancelled"`
}