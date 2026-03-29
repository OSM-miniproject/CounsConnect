package middleware

import (
    "fmt"
    "net/http"
    "strings"

    "github.com/dgrijalva/jwt-go"
    "github.com/gin-gonic/gin"
    "go.mongodb.org/mongo-driver/bson/primitive"
)

// AuthMiddleware handles JWT authentication
func AuthMiddleware(jwtSecret string) gin.HandlerFunc {
    return func(c *gin.Context) {
        // Get the Authorization header
        authHeader := c.GetHeader("Authorization")
        if authHeader == "" {
            c.JSON(http.StatusUnauthorized, gin.H{"error": "authorization header is required"})
            c.Abort()
            return
        }

        // Check if the header format is valid
        parts := strings.SplitN(authHeader, " ", 2)
        if !(len(parts) == 2 && parts[0] == "Bearer") {
            c.JSON(http.StatusUnauthorized, gin.H{"error": "invalid authorization header format"})
            c.Abort()
            return
        }

        // Extract the token
        tokenString := parts[1]

        // Parse and validate the token
        token, err := jwt.Parse(tokenString, func(token *jwt.Token) (interface{}, error) {
            // Validate the signing method
            if _, ok := token.Method.(*jwt.SigningMethodHMAC); !ok {
                return nil, fmt.Errorf("unexpected signing method: %v", token.Header["alg"])
            }
            return []byte(jwtSecret), nil
        })

        if err != nil {
            c.JSON(http.StatusUnauthorized, gin.H{"error": "invalid or expired token"})
            c.Abort()
            return
        }

        if claims, ok := token.Claims.(jwt.MapClaims); ok && token.Valid {
            // Extract user ID from token claims
            userIDStr, ok := claims["user_id"].(string)
            if !ok {
                c.JSON(http.StatusUnauthorized, gin.H{"error": "invalid token claims"})
                c.Abort()
                return
            }

            // Extract role from token claims
            role, ok := claims["role"].(string)
            if !ok {
                c.JSON(http.StatusUnauthorized, gin.H{"error": "invalid token claims"})
                c.Abort()
                return
            }

            // Convert the string user ID to ObjectID
            userID, err := primitive.ObjectIDFromHex(userIDStr)
            if err != nil {
                c.JSON(http.StatusUnauthorized, gin.H{"error": "invalid user ID in token"})
                c.Abort()
                return
            }

            // For task endpoints, we'll just set the userID and role in context
            // without additional authorization checks
            c.Set("userID", userID)
            c.Set("role", role)
            c.Next()
        } else {
            c.JSON(http.StatusUnauthorized, gin.H{"error": "invalid token"})
            c.Abort()
            return
        }
    }
}