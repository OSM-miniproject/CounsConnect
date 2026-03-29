package models

import (
    "time"

    "go.mongodb.org/mongo-driver/bson/primitive"
)

// Task represents a task assigned by a counselor to a patient
type Task struct {
    ID          primitive.ObjectID `json:"id" bson:"_id,omitempty"`
    PatientID   primitive.ObjectID `json:"patientId" bson:"patientId"`
    CounselorID primitive.ObjectID `json:"counselorId" bson:"counselorId"`
    Title       string             `json:"title" bson:"title"`
    Description string             `json:"description" bson:"description"`
    Frequency   string             `json:"frequency" bson:"frequency"` // daily, weekly, monthly, once
    Deadline    time.Time          `json:"deadline" bson:"deadline"`
    Status      string             `json:"status" bson:"status"` // pending, completed, overdue
    Feedback    string             `json:"feedback" bson:"feedback"`
    CreatedAt   time.Time          `json:"createdAt" bson:"createdAt"`
    UpdatedAt   time.Time          `json:"updatedAt" bson:"updatedAt,omitempty"`
}

// TaskInput represents the input for creating a new task
type TaskInput struct {
    PatientID   string `json:"patientId" binding:"required"`
    Title       string `json:"title" binding:"required"`
    Description string `json:"description" binding:"required"`
    Frequency   string `json:"frequency" binding:"required,oneof=daily weekly monthly once"`
    Deadline    string `json:"deadline" binding:"required"` // Format: YYYY-MM-DDTHH:MM:SSZ
}

// TaskUpdateInput represents the input for updating a task
type TaskUpdateInput struct {
    Title       string `json:"title"`
    Description string `json:"description"`
    Frequency   string `json:"frequency" binding:"omitempty,oneof=daily weekly monthly once"`
    Deadline    string `json:"deadline"` // Format: YYYY-MM-DDTHH:MM:SSZ
    Status      string `json:"status" binding:"omitempty,oneof=pending completed overdue"`
}

// TaskStatusUpdate represents the input for updating a task's status
type TaskStatusUpdate struct {
    Status string `json:"status" binding:"required,oneof=pending completed overdue"`
}

// TaskFeedbackInput represents the input for adding feedback to a task
type TaskFeedbackInput struct {
    Feedback string `json:"feedback" binding:"required"`
}

// TaskResponse represents the response format for a task
type TaskResponse struct {
    ID          primitive.ObjectID `json:"id"`
    PatientID   primitive.ObjectID `json:"patientId"`
    CounselorID primitive.ObjectID `json:"counselorId"`
    Title       string             `json:"title"`
    Description string             `json:"description"`
    Frequency   string             `json:"frequency"`
    Deadline    string             `json:"deadline"` // ISO format
    Status      string             `json:"status"`
    Feedback    string             `json:"feedback"`
    CreatedAt   string             `json:"createdAt"` // ISO format
    UpdatedAt   string             `json:"updatedAt,omitempty"` // ISO format
}

// ToTaskResponse converts a Task to a TaskResponse
func (t *Task) ToTaskResponse() TaskResponse {
    response := TaskResponse{
        ID:          t.ID,
        PatientID:   t.PatientID,
        CounselorID: t.CounselorID,
        Title:       t.Title,
        Description: t.Description,
        Frequency:   t.Frequency,
        Deadline:    t.Deadline.Format(time.RFC3339),
        Status:      t.Status,
        Feedback:    t.Feedback,
        CreatedAt:   t.CreatedAt.Format(time.RFC3339),
    }

    if !t.UpdatedAt.IsZero() {
        response.UpdatedAt = t.UpdatedAt.Format(time.RFC3339)
    }

    return response
}