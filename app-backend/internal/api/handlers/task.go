package handlers

import (
    "net/http"

    "github.com/gin-gonic/gin"
    "github.com/thundersp/backend/models"
    "github.com/thundersp/backend/service"
    "go.mongodb.org/mongo-driver/bson/primitive"
)

// TaskHandler handles task-related requests
type TaskHandler struct {
    taskService *service.TaskService
}

// NewTaskHandler creates a new task handler
func NewTaskHandler(taskService *service.TaskService) *TaskHandler {
    return &TaskHandler{
        taskService: taskService,
    }
}

// CreateTask creates a new task
func (h *TaskHandler) CreateTask(c *gin.Context) {
    // Get counselor ID from context
    counselorID, exists := c.Get("userID")
    if !exists {
        c.JSON(http.StatusUnauthorized, gin.H{"error": "unauthorized"})
        return
    }

    var input models.TaskInput
    if err := c.ShouldBindJSON(&input); err != nil {
        c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
        return
    }

    task, err := h.taskService.CreateTask(counselorID.(primitive.ObjectID), input)
    if err != nil {
        c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
        return
    }

    c.JSON(http.StatusCreated, task.ToTaskResponse())
}

// GetTaskByID gets a task by ID
func (h *TaskHandler) GetTaskByID(c *gin.Context) {
    // Get user ID from context
    userID, exists := c.Get("userID")
    if !exists {
        c.JSON(http.StatusUnauthorized, gin.H{"error": "unauthorized"})
        return
    }

    idStr := c.Param("id")
    taskID, err := primitive.ObjectIDFromHex(idStr)
    if err != nil {
        c.JSON(http.StatusBadRequest, gin.H{"error": "invalid task ID"})
        return
    }

    task, err := h.taskService.GetTaskByID(taskID, userID.(primitive.ObjectID))
    if err != nil {
        c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
        return
    }

    c.JSON(http.StatusOK, task.ToTaskResponse())
}

// GetTasks gets all tasks for the current user
// Assuming this is the GetTasks handler function in your task.go file

// GetTasks gets all tasks without authentication requirements
func (h *TaskHandler) GetTasks(c *gin.Context) {
    // Get all tasks without filtering by user
    tasks, err := h.taskService.GetAllTasks()
    if err != nil {
        c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
        return
    }
    
    c.JSON(http.StatusOK, tasks)
}
// GetPatientTasks gets all tasks for a specific patient (counselor only)
func (h *TaskHandler) GetPatientTasks(c *gin.Context) {
    // Get counselor ID from context
    counselorID, exists := c.Get("userID")
    if !exists {
        c.JSON(http.StatusUnauthorized, gin.H{"error": "unauthorized"})
        return
    }

    patientIDStr := c.Param("patientId")
    patientID, err := primitive.ObjectIDFromHex(patientIDStr)
    if err != nil {
        c.JSON(http.StatusBadRequest, gin.H{"error": "invalid patient ID"})
        return
    }

    tasks, err := h.taskService.GetPatientTasks(patientID, counselorID.(primitive.ObjectID))
    if err != nil {
        c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
        return
    }

    // Convert tasks to response format
    var response []models.TaskResponse
    for _, task := range tasks {
        response = append(response, task.ToTaskResponse())
    }

    c.JSON(http.StatusOK, response)
}

// GetUpcomingTasks gets upcoming tasks for the current user
func (h *TaskHandler) GetUpcomingTasks(c *gin.Context) {
    // Get user ID and role from context
    userID, exists := c.Get("userID")
    if !exists {
        c.JSON(http.StatusUnauthorized, gin.H{"error": "unauthorized"})
        return
    }

    role, exists := c.Get("userRole")
    if !exists {
        c.JSON(http.StatusUnauthorized, gin.H{"error": "unauthorized"})
        return
    }

    isPatient := role.(string) == "patient"
    tasks, err := h.taskService.GetUpcomingTasks(userID.(primitive.ObjectID), isPatient)
    if err != nil {
        c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
        return
    }

    // Convert tasks to response format
    var response []models.TaskResponse
    for _, task := range tasks {
        response = append(response, task.ToTaskResponse())
    }

    c.JSON(http.StatusOK, response)
}

// UpdateTask updates a task (counselor only)
func (h *TaskHandler) UpdateTask(c *gin.Context) {
    // Get counselor ID from context
    counselorID, exists := c.Get("userID")
    if !exists {
        c.JSON(http.StatusUnauthorized, gin.H{"error": "unauthorized"})
        return
    }

    idStr := c.Param("id")
    taskID, err := primitive.ObjectIDFromHex(idStr)
    if err != nil {
        c.JSON(http.StatusBadRequest, gin.H{"error": "invalid task ID"})
        return
    }

    var input models.TaskUpdateInput
    if err := c.ShouldBindJSON(&input); err != nil {
        c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
        return
    }

    task, err := h.taskService.UpdateTask(taskID, counselorID.(primitive.ObjectID), input)
    if err != nil {
        c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
        return
    }

    c.JSON(http.StatusOK, task.ToTaskResponse())
}

// UpdateTaskStatus updates the status of a task
func (h *TaskHandler) UpdateTaskStatus(c *gin.Context) {
    // Get user ID from context
    userID, exists := c.Get("userID")
    if !exists {
        c.JSON(http.StatusUnauthorized, gin.H{"error": "unauthorized"})
        return
    }

    idStr := c.Param("id")
    taskID, err := primitive.ObjectIDFromHex(idStr)
    if err != nil {
        c.JSON(http.StatusBadRequest, gin.H{"error": "invalid task ID"})
        return
    }

    var input models.TaskStatusUpdate
    if err := c.ShouldBindJSON(&input); err != nil {
        c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
        return
    }

    task, err := h.taskService.UpdateTaskStatus(taskID, userID.(primitive.ObjectID), input.Status)
    if err != nil {
        c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
        return
    }

    c.JSON(http.StatusOK, task.ToTaskResponse())
}

// AddFeedback adds feedback to a task (counselor only)
func (h *TaskHandler) AddFeedback(c *gin.Context) {
    // Get counselor ID from context
    counselorID, exists := c.Get("userID")
    if !exists {
        c.JSON(http.StatusUnauthorized, gin.H{"error": "unauthorized"})
        return
    }

    idStr := c.Param("id")
    taskID, err := primitive.ObjectIDFromHex(idStr)
    if err != nil {
        c.JSON(http.StatusBadRequest, gin.H{"error": "invalid task ID"})
        return
    }

    var input models.TaskFeedbackInput
    if err := c.ShouldBindJSON(&input); err != nil {
        c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
        return
    }

    task, err := h.taskService.AddFeedback(taskID, counselorID.(primitive.ObjectID), input.Feedback)
    if err != nil {
        c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
        return
    }

    c.JSON(http.StatusOK, task.ToTaskResponse())
}

// DeleteTask deletes a task (counselor only)
func (h *TaskHandler) DeleteTask(c *gin.Context) {
    // Get counselor ID from context
    counselorID, exists := c.Get("userID")
    if !exists {
        c.JSON(http.StatusUnauthorized, gin.H{"error": "unauthorized"})
        return
    }

    idStr := c.Param("id")
    taskID, err := primitive.ObjectIDFromHex(idStr)
    if err != nil {
        c.JSON(http.StatusBadRequest, gin.H{"error": "invalid task ID"})
        return
    }

    err = h.taskService.DeleteTask(taskID, counselorID.(primitive.ObjectID))
    if err != nil {
        c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
        return
    }

    c.JSON(http.StatusOK, gin.H{"message": "task deleted successfully"})
}