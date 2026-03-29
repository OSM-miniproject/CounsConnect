package models

import (
    "time"

    "go.mongodb.org/mongo-driver/bson/primitive"
)

// Message represents a message in the secure chat system
type Message struct {
    ID         primitive.ObjectID `json:"id" bson:"_id,omitempty"`
    SenderID   primitive.ObjectID `json:"sender_id" bson:"sender_id"`
    ReceiverID primitive.ObjectID `json:"receiver_id" bson:"receiver_id"`
    Message    string             `json:"message" bson:"message"`
    Timestamp  time.Time          `json:"timestamp" bson:"timestamp"`
    Type       string             `json:"type" bson:"type"` // "text", "video-call-link", "system"
    CreatedAt  time.Time          `json:"created_at" bson:"created_at"`
}

// MessageInput is used to create a new message
type MessageInput struct {
    ReceiverID string `json:"receiver_id" binding:"required"`
    Message    string `json:"message" binding:"required"`
    Type       string `json:"type" binding:"required,oneof=text video-call-link system"`
}

// MessageResponse represents a message in responses
type MessageResponse struct {
    ID         primitive.ObjectID `json:"id"`
    SenderID   primitive.ObjectID `json:"sender_id"`
    ReceiverID primitive.ObjectID `json:"receiver_id"`
    Message    string             `json:"message"`
    Timestamp  time.Time          `json:"timestamp"`
    Type       string             `json:"type"`
    SenderName string             `json:"sender_name"`
}