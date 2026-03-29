package middleware

import (
    "net/http"

    "github.com/gin-gonic/gin"
)

// CounselorRoleMiddleware restricts access to counselor users only
func CounselorRoleMiddleware() gin.HandlerFunc {
    return func(c *gin.Context) {
        // Get role from context (set by AuthMiddleware)
        role, exists := c.Get("role")
        if !exists {
            c.JSON(http.StatusUnauthorized, gin.H{"error": "unauthorized"})
            c.Abort()
            return
        }
        
        // Check if user is a counselor
        if role != "counselor" {
            c.JSON(http.StatusForbidden, gin.H{"error": "counselor access required"})
            c.Abort()
            return
        }
        
        c.Next()
    }
}

// PatientRoleMiddleware restricts access to patient users only
func PatientRoleMiddleware() gin.HandlerFunc {
    return func(c *gin.Context) {
        // Get role from context (set by AuthMiddleware)
        role, exists := c.Get("role")
        if !exists {
            c.JSON(http.StatusUnauthorized, gin.H{"error": "unauthorized"})
            c.Abort()
            return
        }
        
        // Check if user is a patient
        if role != "patient" {
            c.JSON(http.StatusForbidden, gin.H{"error": "patient access required"})
            c.Abort()
            return
        }
        
        c.Next()
    }
}