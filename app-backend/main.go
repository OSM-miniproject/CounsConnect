package main

import (
    "context"
    "log"
    "net/http"
    "os"
    "os/signal"
    "time"

    "github.com/gin-gonic/gin"
    "github.com/joho/godotenv"
    "github.com/thundersp/backend/config"
    "github.com/thundersp/backend/internal/api"
    "github.com/thundersp/backend/repository/mongodb"
)

func main() {
    // Load environment variables
    if err := godotenv.Load(); err != nil {
        log.Println("No .env file found")
    }

    // Initialize configuration
    cfg, err := config.LoadConfig()
    if err != nil {
        log.Fatalf("Failed to load config: %v", err)
    }

    // Connect to MongoDB
    client, err := mongodb.ConnectMongoDB(cfg.MongoDB.URI)
    if err != nil {
        log.Fatalf("Failed to connect to MongoDB: %v", err)
    }
    defer client.Disconnect(context.Background())

    // Create repositories
    userRepo := mongodb.NewUserRepository(client.Database(cfg.MongoDB.Database))

    // Setup Gin router
    router := gin.Default()

    // Setup routes
    routes.SetupRoutes(router, userRepo, cfg.JWT.Secret)

    // Create HTTP server
    srv := &http.Server{
        Addr:    ":" + cfg.Server.Port,
        Handler: router,
    }

    // Start server in a goroutine
    go func() {
        log.Printf("Server starting on port %s", cfg.Server.Port)
        if err := srv.ListenAndServe(); err != nil && err != http.ErrServerClosed {
            log.Fatalf("Failed to start server: %v", err)
        }
    }()

    // Wait for interrupt signal to gracefully shutdown the server
    quit := make(chan os.Signal, 1)
    signal.Notify(quit, os.Interrupt)
    <-quit
    log.Println("Shutting down server...")

    // Create a deadline to wait for
    ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
    defer cancel()
    if err := srv.Shutdown(ctx); err != nil {
        log.Fatalf("Server forced to shutdown: %v", err)
    }

    log.Println("Server exiting")
}