package routes

import (
    "time"

    "github.com/gin-gonic/gin"
    "github.com/thundersp/backend/internal/api/handlers"
    "github.com/thundersp/backend/middleware"
    "github.com/thundersp/backend/repository/mongodb"
    "github.com/thundersp/backend/service"
)

// SetupRoutes configures all routes for the application
func SetupRoutes(router *gin.Engine, userRepo *mongodb.UserRepository, jwtSecret string) {
    // Initialize repositories
    db := userRepo.GetDB()
    patientProfileRepo := mongodb.NewPatientProfileRepository(db)
    counselorProfileRepo := mongodb.NewCounselorProfileRepository(db)
    appointmentRepo := mongodb.NewAppointmentRepository(db)
    taskRepo := mongodb.NewTaskRepository(db)
    
    // Create services
    authService := service.NewAuthService(userRepo, patientProfileRepo, counselorProfileRepo, jwtSecret, 24*time.Hour)
    adminService := service.NewAdminService(userRepo)
    appointmentService := service.NewAppointmentService(appointmentRepo, userRepo)
    taskService := service.NewTaskService(taskRepo, userRepo)
    
    // Create handlers
    authHandler := handlers.NewAuthHandler(authService)
    adminHandler := handlers.NewAdminHandler(adminService)
    appointmentHandler := handlers.NewAppointmentHandler(appointmentService)
    taskHandler := handlers.NewTaskHandler(taskService)
    
    // API routes
    api := router.Group("/api")
    {
        // Public routes
        auth := api.Group("/auth")
        {
            auth.POST("/register", authHandler.Register)
            auth.POST("/login", authHandler.Login)
        }
        
        // Task routes - completely public with no authentication
        tasks := api.Group("/tasks")
        {
            tasks.GET("", taskHandler.GetTasks)                  // Get all tasks
            tasks.GET("/upcoming", taskHandler.GetUpcomingTasks) // Get upcoming tasks
            tasks.GET("/:id", taskHandler.GetTaskByID)           // Get specific task
            tasks.PUT("/:id/status", taskHandler.UpdateTaskStatus) // Update task status
            tasks.POST("/create", taskHandler.CreateTask)        // Create task
            tasks.PUT("/:id", taskHandler.UpdateTask)           // Update task
            tasks.DELETE("/:id", taskHandler.DeleteTask)        // Delete task
            tasks.GET("/patient/:patientId", taskHandler.GetPatientTasks) // Get patient tasks
            tasks.POST("/:id/feedback", taskHandler.AddFeedback) // Add feedback
        }
        
        // Public appointment routes
        // publicAppointments := api.Group("/appointments")
        // {
        //     publicAppointments.GET("", appointmentHandler.GetAllAppointments) // Get all appointments - public access
        // }
        
        // Protected routes - require authentication
        protected := api.Group("/")
        protected.Use(middleware.AuthMiddleware(jwtSecret))
        {
            // User profile routes
            protected.GET("/me", authHandler.GetMe)
            protected.POST("/profile/complete", authHandler.CompleteProfile)
            
            // Protected appointment routes for users
            appointments := protected.Group("/appointments")
            {
                appointments.GET("/upcoming", appointmentHandler.GetUpcomingAppointments)
                appointments.GET("/:id", appointmentHandler.GetAppointmentByID)
                
                // Counselor-specific appointment routes
                counselorAppointments := appointments.Group("/")
                counselorAppointments.Use(middleware.CounselorRoleMiddleware())
                {
                    counselorAppointments.POST("/create", appointmentHandler.CreateAppointment)
                    counselorAppointments.PUT("/:id", appointmentHandler.UpdateAppointment)
                    counselorAppointments.DELETE("/:id", appointmentHandler.DeleteAppointment)
                }
                
                // Common appointment routes for both roles
                appointments.PUT("/:id/status", appointmentHandler.UpdateAppointmentStatus)
            }
            
            // Admin routes - require admin role
            admin := protected.Group("/admin")
            admin.Use(middleware.AdminMiddleware(userRepo))
            {
                // Admin user management
                users := admin.Group("/users")
                {
                    users.GET("", adminHandler.GetAllUsers)
                    users.GET("/:id", adminHandler.GetUserByID)
                    users.POST("", adminHandler.CreateUser)
                    users.PUT("/:id", adminHandler.UpdateUser)
                    users.DELETE("/:id", adminHandler.DeleteUser)
                }
            }
        }
    }
}