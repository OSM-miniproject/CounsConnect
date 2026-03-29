package handlers

import (
	"net/http"

	"github.com/gin-gonic/gin"
	"github.com/thundersp/backend/models"
	"github.com/thundersp/backend/service"
	"go.mongodb.org/mongo-driver/bson/primitive"
)

// AuthHandler handles authentication related requests
type AuthHandler struct {
    authService *service.AuthService
}

// NewAuthHandler creates a new auth handler
func NewAuthHandler(authService *service.AuthService) *AuthHandler {
    return &AuthHandler{
        authService: authService,
    }
}

// Register handles user registration
func (h *AuthHandler) Register(c *gin.Context) {
    var input models.UserRegisterInput
    
    if err := c.ShouldBindJSON(&input); err != nil {
        c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
        return
    }
    
    user, err := h.authService.Register(input)
    if err != nil {
        c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
        return
    }
    
    c.JSON(http.StatusCreated, user.ToUserResponse())
}

// Login handles user login
func (h *AuthHandler) Login(c *gin.Context) {
    var input models.UserLoginInput
    
    if err := c.ShouldBindJSON(&input); err != nil {
        c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
        return
    }
    
    response, err := h.authService.Login(input)
    if err != nil {
        c.JSON(http.StatusUnauthorized, gin.H{"error": err.Error()})
        return
    }
    
    c.JSON(http.StatusOK, response)
}

// GetMe gets the current user
func (h *AuthHandler) GetMe(c *gin.Context) {
    userID, exists := c.Get("userID")
    if !exists {
        c.JSON(http.StatusUnauthorized, gin.H{"error": "unauthorized"})
        return
    }
    
    user, err := h.authService.GetUserByID(userID.(primitive.ObjectID))
    if err != nil {
        c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to retrieve user"})
        return
    }
    
    if user == nil {
        c.JSON(http.StatusNotFound, gin.H{"error": "user not found"})
        return
    }
    
    c.JSON(http.StatusOK, user.ToUserResponse())
}

// CompleteProfile updates a user's profile information
func (h *AuthHandler) CompleteProfile(c *gin.Context) {
    userID, exists := c.Get("userID")
    if !exists {
        c.JSON(http.StatusUnauthorized, gin.H{"error": "unauthorized"})
        return
    }
    
    var input models.ProfileUpdateInput
    if err := c.ShouldBindJSON(&input); err != nil {
        c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
        return
    }
    
    updatedUser, err := h.authService.UpdateProfile(userID.(primitive.ObjectID), input)
    if err != nil {
        c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
        return
    }
    
    c.JSON(http.StatusOK, updatedUser.ToUserResponse())
}