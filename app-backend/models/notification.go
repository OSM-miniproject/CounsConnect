package models

import (
    "time"

    "go.mongodb.org/mongo-driver/bson/primitive"
)

// Notification represents a notification sent to a user
type Notification struct {
    ID        primitive.ObjectID `json:"id" bson:"_id,omitempty"`
    UserID    primitive.ObjectID `json:"user_id" bson:"user_id"`
    Message   string             `json:"message" bson:"message"`
    Type      string             `json:"type" bson:"type"` // "task", "appointment", "alert"
    Read      bool               `json:"read" bson:"read"`
    Timestamp time.Time          `json:"timestamp" bson:"timestamp"`
    CreatedAt time.Time          `json:"created_at" bson:"created_at"`
}

// NotificationInput is used to create a new notification
type NotificationInput struct {
    UserID  string `json:"user_id" binding:"required"`
    Message string `json:"message" binding:"required"`
    Type    string `json:"type" binding:"required,oneof=task appointment alert"`
}

// NotificationReadInput is used to mark a notification as read
type NotificationReadInput struct {
    Read bool `json:"read" binding:"required"`
}