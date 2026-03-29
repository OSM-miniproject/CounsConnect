package models

import (
    "time"

    "go.mongodb.org/mongo-driver/bson/primitive"
)

// TimeSlot represents a 1-hour time slot
type TimeSlot struct {
    StartTime time.Time         `json:"start_time" bson:"start_time"`
    EndTime   time.Time         `json:"end_time" bson:"end_time"`
    UserID    primitive.ObjectID `json:"user_id" bson:"user_id,omitempty"`
    Username  string            `json:"username" bson:"username,omitempty"`
}

// Schedule represents a daily schedule with available time slots
type Schedule struct {
    ID        primitive.ObjectID `json:"id" bson:"_id,omitempty"`
    Date      time.Time          `json:"date" bson:"date"`
    TimeSlots []TimeSlot         `json:"time_slots" bson:"time_slots"`
    CreatedAt time.Time          `json:"created_at" bson:"created_at"`
    UpdatedAt time.Time          `json:"updated_at" bson:"updated_at"`
}

// BookingRequest represents a request to book a time slot
type BookingRequest struct {
    Date      string `json:"date" binding:"required"`      // Format: YYYY-MM-DD
    StartTime string `json:"start_time" binding:"required"` // Format: HH:MM (24-hour)
}

// ScheduleResponse represents a schedule response with simplified data
type ScheduleResponse struct {
    ID        primitive.ObjectID `json:"id"`
    Date      string             `json:"date"`
    TimeSlots []TimeSlotResponse `json:"time_slots"`
}

// TimeSlotResponse represents a time slot in responses
type TimeSlotResponse struct {
    StartTime string             `json:"start_time"`
    EndTime   string             `json:"end_time"`
    Available bool               `json:"available"`
    UserID    primitive.ObjectID `json:"user_id,omitempty"`
    Username  string             `json:"username,omitempty"`
}