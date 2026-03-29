package middleware

import (
    "net/http"

    "github.com/gin-gonic/gin"
    "github.com/thundersp/backend/repository/mongodb"
    "go.mongodb.org/mongo-driver/bson/primitive"
)

// AdminMiddleware restricts access to admin users only
func AdminMiddleware(userRepo *mongodb.UserRepository) gin.HandlerFunc {
    return func(c *gin.Context) {
        // Get user ID from context (set by AuthMiddleware)
        userID, exists := c.Get("userID")
        if !exists {
            c.JSON(http.StatusUnauthorized, gin.H{"error": "unauthorized"})
            c.Abort()
            return
        }
        
        // Get user from repository
        user, err := userRepo.FindByID(userID.(primitive.ObjectID))
        if err != nil {
            c.JSON(http.StatusInternalServerError, gin.H{"error": "error retrieving user"})
            c.Abort()
            return
        }
        
        if user == nil {
            c.JSON(http.StatusUnauthorized, gin.H{"error": "user not found"})
            c.Abort()
            return
        }
        
        // Check if user is admin
        if !user.IsAdmin {
            c.JSON(http.StatusForbidden, gin.H{"error": "admin access required"})
            c.Abort()
            return
        }
        
        c.Next()
    }
}