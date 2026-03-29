package models

import (
    "time"

    "go.mongodb.org/mongo-driver/bson/primitive"
)

// User represents the base user model for both counselors and patients
type User struct {
    ID           primitive.ObjectID `json:"id" bson:"_id,omitempty"`
    Name         string             `json:"name" bson:"name"`
    Email        string             `json:"email" bson:"email"`
    Password     string             `json:"-" bson:"password"` // Password hash, not included in JSON responses
    Role         string             `json:"role" bson:"role"`  // "counselor" or "patient"
    Username     string             `json:"username" bson:"username"`
    PhoneNumber  string             `json:"phone_number" bson:"phone_number"`
    PlaceOfStay  string             `json:"place_of_stay" bson:"place_of_stay"`
    IsAdmin      bool               `json:"is_admin" bson:"is_admin"`
    CreatedAt    time.Time          `json:"created_at" bson:"created_at"`
    UpdatedAt    time.Time          `json:"updated_at" bson:"updated_at"`
    UID          string             `json:"uid" bson:"uid"`
}

// UserRegisterInput represents registration input data
type UserRegisterInput struct {
    UID         string  `json:"uid" binding:"required"`
    Username    string `json:"username" binding:"required,min=3,max=30"`
    Email       string `json:"email" binding:"required,email"`
    Password    string `json:"password" binding:"required,min=6"`
    Role        string `json:"role" binding:"required,oneof=counselor patient"`
}

// UserLoginInput represents login input data
type UserLoginInput struct {
    Email    string `json:"email" binding:"required,email"`
    Password string `json:"password" binding:"required"`
}

// ProfileUpdateInput represents profile update input data
type ProfileUpdateInput struct {
    Name        string `json:"name" binding:"required"`
    PhoneNumber string `json:"phone_number" binding:"required"`
    PlaceOfStay string `json:"place_of_stay" binding:"required"`
}

// UserResponse represents user data sent in responses (without sensitive data)
type UserResponse struct {
    ID           primitive.ObjectID `json:"id"`
    Username      string            `json:"username"`
    Email         string            `json:"email"`
    Name          string            `json:"name"`
    Role          string            `json:"role"`
    PhoneNumber   string            `json:"phone_number,omitempty"`
    PlaceOfStay   string            `json:"place_of_stay,omitempty"`
    IsAdmin       bool              `json:"is_admin,omitempty"`
    CreatedAt     time.Time         `json:"created_at"`
}

// ToUserResponse converts User to UserResponse
func (u *User) ToUserResponse() UserResponse {
    return UserResponse{
        ID:          u.ID,
        Username:    u.Username,
        Email:       u.Email,
        Name:        u.Name,
        Role:        u.Role,
        PhoneNumber: u.PhoneNumber,
        PlaceOfStay: u.PlaceOfStay,
        IsAdmin:     u.IsAdmin,
        CreatedAt:   u.CreatedAt,
    }
}

// AuthResponse represents authentication response with token
type AuthResponse struct {
    Token string       `json:"token"`
    User  UserResponse `json:"user"`
}

// AdminCreateUserInput represents input for creating a user as admin
type AdminCreateUserInput struct {
    Username    string `json:"username" binding:"required,min=3,max=30"`
    Email       string `json:"email" binding:"required,email"`
    Password    string `json:"password" binding:"required,min=6"`
    Name        string `json:"name" binding:"required"`
    Role        string `json:"role" binding:"required,oneof=counselor patient"`
    PhoneNumber string `json:"phone_number"`
    PlaceOfStay string `json:"place_of_stay"`
    IsAdmin     bool   `json:"is_admin"`
}

// AdminUpdateUserInput represents input for updating a user as admin
type AdminUpdateUserInput struct {
    Username    string `json:"username"`
    Email       string `json:"email"`
    Password    string `json:"password"`
    Name        string `json:"name"`
    Role        string `json:"role,omitempty" binding:"omitempty,oneof=counselor patient"`
    PhoneNumber string `json:"phone_number"`
    PlaceOfStay string `json:"place_of_stay"`
    IsAdmin     bool   `json:"is_admin"`
}