package handlers

import (
    "net/http"

    "github.com/gin-gonic/gin"
    "github.com/thundersp/backend/models"
    "github.com/thundersp/backend/service"
    "go.mongodb.org/mongo-driver/bson/primitive"
)

// AdminHandler handles admin operations
type AdminHandler struct {
    adminService *service.AdminService
}

// NewAdminHandler creates a new admin handler
func NewAdminHandler(adminService *service.AdminService) *AdminHandler {
    return &AdminHandler{
        adminService: adminService,
    }
}

// GetAllUsers gets all users
func (h *AdminHandler) GetAllUsers(c *gin.Context) {
    users, err := h.adminService.GetAllUsers()
    if err != nil {
        c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
        return
    }
    
    // Convert users to response format
    var response []models.UserResponse
    for _, user := range users {
        response = append(response, user.ToUserResponse())
    }
    
    c.JSON(http.StatusOK, response)
}

// GetUserByID gets a user by ID
func (h *AdminHandler) GetUserByID(c *gin.Context) {
    id := c.Param("id")
    
    // Convert ID string to ObjectID
    userID, err := primitive.ObjectIDFromHex(id)
    if err != nil {
        c.JSON(http.StatusBadRequest, gin.H{"error": "invalid user ID"})
        return
    }
    
    user, err := h.adminService.GetUserByID(userID)
    if err != nil {
        c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
        return
    }
    
    c.JSON(http.StatusOK, user.ToUserResponse())
}

// CreateUser creates a new user
func (h *AdminHandler) CreateUser(c *gin.Context) {
    var input models.AdminCreateUserInput
    
    if err := c.ShouldBindJSON(&input); err != nil {
        c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
        return
    }
    
    user, err := h.adminService.CreateUser(input)
    if err != nil {
        c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
        return
    }
    
    c.JSON(http.StatusCreated, user.ToUserResponse())
}

// UpdateUser updates a user
func (h *AdminHandler) UpdateUser(c *gin.Context) {
    id := c.Param("id")
    
    // Convert ID string to ObjectID
    userID, err := primitive.ObjectIDFromHex(id)
    if err != nil {
        c.JSON(http.StatusBadRequest, gin.H{"error": "invalid user ID"})
        return
    }
    
    var input models.AdminUpdateUserInput
    if err := c.ShouldBindJSON(&input); err != nil {
        c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
        return
    }
    
    user, err := h.adminService.UpdateUser(userID, input)
    if err != nil {
        c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
        return
    }
    
    c.JSON(http.StatusOK, user.ToUserResponse())
}

// DeleteUser deletes a user
func (h *AdminHandler) DeleteUser(c *gin.Context) {
    id := c.Param("id")
    
    // Convert ID string to ObjectID
    userID, err := primitive.ObjectIDFromHex(id)
    if err != nil {
        c.JSON(http.StatusBadRequest, gin.H{"error": "invalid user ID"})
        return
    }
    
    err = h.adminService.DeleteUser(userID)
    if err != nil {
        c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
        return
    }
    
    c.JSON(http.StatusOK, gin.H{"message": "user deleted successfully"})
}