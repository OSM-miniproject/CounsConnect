package models

import (
    "time"

    "go.mongodb.org/mongo-driver/bson/primitive"
)

// Resource represents a therapeutic resource shared by counselors
type Resource struct {
    ID          primitive.ObjectID   `json:"id" bson:"_id,omitempty"`
    UploadedBy  primitive.ObjectID   `json:"uploaded_by" bson:"uploaded_by"`
    Type        string               `json:"type" bson:"type"` // "video", "pdf", "article", "exercise"
    Title       string               `json:"title" bson:"title"`
    Description string               `json:"description" bson:"description"`
    URL         string               `json:"url" bson:"url"` // File path or external link
    AssignedTo  []primitive.ObjectID `json:"assigned_to" bson:"assigned_to"`
    CreatedAt   time.Time            `json:"created_at" bson:"created_at"`
    UpdatedAt   time.Time            `json:"updated_at" bson:"updated_at"`
}

// ResourceInput is used to create a new resource
type ResourceInput struct {
    Type        string   `json:"type" binding:"required,oneof=video pdf article exercise"`
    Title       string   `json:"title" binding:"required"`
    Description string   `json:"description" binding:"required"`
    URL         string   `json:"url" binding:"required"`
    AssignedTo  []string `json:"assigned_to"`
}

// ResourceUpdateInput is used to update an existing resource
type ResourceUpdateInput struct {
    Type        string   `json:"type" binding:"omitempty,oneof=video pdf article exercise"`
    Title       string   `json:"title"`
    Description string   `json:"description"`
    URL         string   `json:"url"`
    AssignedTo  []string `json:"assigned_to"`
}

// ResourceAssignInput is used to assign resources to patients
type ResourceAssignInput struct {
    PatientIDs []string `json:"patient_ids" binding:"required"`
}