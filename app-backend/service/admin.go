package service

import (
    "errors"

    "github.com/thundersp/backend/models"
    "github.com/thundersp/backend/pkg/crypto"
    "github.com/thundersp/backend/repository/mongodb"
    "go.mongodb.org/mongo-driver/bson"
    "go.mongodb.org/mongo-driver/bson/primitive"
)

// AdminService handles admin operations
type AdminService struct {
    userRepo *mongodb.UserRepository
}

// NewAdminService creates a new admin service
func NewAdminService(userRepo *mongodb.UserRepository) *AdminService {
    return &AdminService{
        userRepo: userRepo,
    }
}

// GetAllUsers retrieves all users
func (s *AdminService) GetAllUsers() ([]*models.User, error) {
    return s.userRepo.FindAll()
}

// GetUserByID retrieves a user by ID
func (s *AdminService) GetUserByID(userID primitive.ObjectID) (*models.User, error) {
    user, err := s.userRepo.FindByID(userID)
    if err != nil {
        return nil, err
    }
    
    if user == nil {
        return nil, errors.New("user not found")
    }
    
    return user, nil
}

// CreateUser creates a new user as admin
func (s *AdminService) CreateUser(input models.AdminCreateUserInput) (*models.User, error) {
    // Check if email is already registered
    existingUser, err := s.userRepo.FindByEmail(input.Email)
    if err != nil {
        return nil, err
    }
    
    if existingUser != nil {
        return nil, errors.New("email already registered")
    }
    
    // Hash password
    hashedPassword, err := crypto.HashPassword(input.Password)
    if err != nil {
        return nil, err
    }
    
    // Create new user
    user := models.User{
        Username:    input.Username,
        Email:       input.Email,
        Password:    hashedPassword,
        Name:        input.Name,
        PhoneNumber: input.PhoneNumber,
        PlaceOfStay: input.PlaceOfStay,
        IsAdmin:     input.IsAdmin,
    }
    
    createdUser, err := s.userRepo.Create(user)
    if err != nil {
        return nil, err
    }
    
    return createdUser, nil
}

// UpdateUser updates a user as admin
func (s *AdminService) UpdateUser(userID primitive.ObjectID, input models.AdminUpdateUserInput) (*models.User, error) {
    // Check if user exists
    user, err := s.userRepo.FindByID(userID)
    if err != nil {
        return nil, err
    }
    
    if user == nil {
        return nil, errors.New("user not found")
    }
    
    // Prepare update
    update := bson.M{}
    
    if input.Username != "" {
        update["username"] = input.Username
    }
    
    if input.Email != "" {
        // Check if email is already used by another user
        if input.Email != user.Email {
            existingUser, err := s.userRepo.FindByEmail(input.Email)
            if err != nil {
                return nil, err
            }
            
            if existingUser != nil && existingUser.ID != user.ID {
                return nil, errors.New("email already registered")
            }
        }
        update["email"] = input.Email
    }
    
    if input.Password != "" {
        hashedPassword, err := crypto.HashPassword(input.Password)
        if err != nil {
            return nil, err
        }
        update["password"] = hashedPassword
    }
    
    if input.Name != "" {
        update["name"] = input.Name
    }
    
    if input.PhoneNumber != "" {
        update["phone_number"] = input.PhoneNumber
    }
    
    if input.PlaceOfStay != "" {
        update["place_of_stay"] = input.PlaceOfStay
    }
    
    update["is_admin"] = input.IsAdmin
    
    // Update user
    updatedUser, err := s.userRepo.Update(userID, update)
    if err != nil {
        return nil, err
    }
    
    return updatedUser, nil
}

// DeleteUser deletes a user
func (s *AdminService) DeleteUser(userID primitive.ObjectID) error {
    // Check if user exists
    user, err := s.userRepo.FindByID(userID)
    if err != nil {
        return err
    }
    
    if user == nil {
        return errors.New("user not found")
    }
    
    // Delete user
    return s.userRepo.Delete(userID)
}