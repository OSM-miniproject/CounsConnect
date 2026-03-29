package service

import (
    "errors"
    "time"

    "github.com/dgrijalva/jwt-go"
    "github.com/thundersp/backend/models"
    "github.com/thundersp/backend/pkg/crypto"
    "github.com/thundersp/backend/repository/mongodb"
    "go.mongodb.org/mongo-driver/bson/primitive"
)

// AuthService handles authentication operations
type AuthService struct {
    userRepo            *mongodb.UserRepository
    patientProfileRepo  *mongodb.PatientProfileRepository
    counselorProfileRepo *mongodb.CounselorProfileRepository
    jwtSecret           string
    jwtExpiresIn        time.Duration
}

// NewAuthService creates a new authentication service
func NewAuthService(
    userRepo *mongodb.UserRepository,
    patientProfileRepo *mongodb.PatientProfileRepository,
    counselorProfileRepo *mongodb.CounselorProfileRepository,
    jwtSecret string,
    jwtExpiresIn time.Duration,
) *AuthService {
    return &AuthService{
        userRepo:            userRepo,
        patientProfileRepo:  patientProfileRepo,
        counselorProfileRepo: counselorProfileRepo,
        jwtSecret:           jwtSecret,
        jwtExpiresIn:        jwtExpiresIn,
    }
}

// Register registers a new user
func (s *AuthService) Register(input models.UserRegisterInput) (*models.User, error) {
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
        Role:        input.Role,
    }
    
    createdUser, err := s.userRepo.Create(user)
    if err != nil {
        return nil, err
    }
    
    // Create role-specific profile
    if createdUser.Role == "patient" {
        patientProfile := models.PatientProfile{
            UserID: createdUser.ID,
            EmergencyContact: models.EmergencyContact{
                Name:  "", // Will be filled in later
                Phone: "", // Will be filled in later
            },
        }
        
        _, err = s.patientProfileRepo.CreatePatientProfile(patientProfile)
        if err != nil {
            // If profile creation fails, we should ideally rollback user creation
            // For simplicity, we'll just log an error and continue
            // In a production app, consider implementing proper transactions
            return nil, errors.New("user created but failed to create patient profile")
        }
    } else if createdUser.Role == "counselor" {
        counselorProfile := models.CounselorProfile{
            UserID:      createdUser.ID,
            Specialties: []string{},
            Availability: []models.Availability{},
        }
        
        _, err = s.counselorProfileRepo.CreateCounselorProfile(counselorProfile)
        if err != nil {
            return nil, errors.New("user created but failed to create counselor profile")
        }
    }
    
    return createdUser, nil
}

// Login authenticates a user and returns a JWT token
func (s *AuthService) Login(input models.UserLoginInput) (*models.AuthResponse, error) {
    // Find user by email
    user, err := s.userRepo.FindByEmail(input.Email)
    if err != nil {
        return nil, err
    }
    
    if user == nil {
        return nil, errors.New("invalid email or password")
    }
    
    // Verify password
    if !crypto.CheckPasswordHash(input.Password, user.Password) {
        return nil, errors.New("invalid email or password")
    }
    
    // Generate JWT token
    token, err := s.GenerateToken(user.ID, user.Role)
    if err != nil {
        return nil, err
    }
    
    return &models.AuthResponse{
        Token: token,
        User:  user.ToUserResponse(),
    }, nil
}

// GenerateToken generates a JWT token for a user
func (s *AuthService) GenerateToken(userID primitive.ObjectID, role string) (string, error) {
    claims := jwt.MapClaims{
        "user_id": userID.Hex(),
        "role":    role,
        "exp":     time.Now().Add(s.jwtExpiresIn).Unix(),
    }
    
    token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
    tokenString, err := token.SignedString([]byte(s.jwtSecret))
    if err != nil {
        return "", err
    }
    
    return tokenString, nil
}

// GetUserByID retrieves a user by ID
func (s *AuthService) GetUserByID(userID primitive.ObjectID) (*models.User, error) {
    return s.userRepo.FindByID(userID)
}

// UpdateProfile updates a user's profile information
func (s *AuthService) UpdateProfile(userID primitive.ObjectID, input models.ProfileUpdateInput) (*models.User, error) {
    // Check if user exists
    user, err := s.userRepo.FindByID(userID)
    if err != nil {
        return nil, err
    }
    
    if user == nil {
        return nil, errors.New("user not found")
    }
    
    // Update user profile
    updatedUser, err := s.userRepo.UpdateProfile(userID, input)
    if err != nil {
        return nil, err
    }
    
    return updatedUser, nil
}