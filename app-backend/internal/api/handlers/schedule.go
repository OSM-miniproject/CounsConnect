package handlers

import (
    "fmt"
    "net/http"
    "time"

    "github.com/gin-gonic/gin"
    "github.com/thundersp/backend/models"
    "github.com/thundersp/backend/service"
    "go.mongodb.org/mongo-driver/bson/primitive"
)

// ScheduleHandler handles schedule operations
type ScheduleHandler struct {
    scheduleService *service.ScheduleService
}

// NewScheduleHandler creates a new schedule handler
func NewScheduleHandler(scheduleService *service.ScheduleService) *ScheduleHandler {
    return &ScheduleHandler{
        scheduleService: scheduleService,
    }
}

// GetScheduleByDate gets a schedule for a specific date
func (h *ScheduleHandler) GetScheduleByDate(c *gin.Context) {
    dateStr := c.Param("date") // Format: YYYY-MM-DD
    
    // Parse date
    date, err := time.Parse("2006-01-02", dateStr)
    if err != nil {
        c.JSON(http.StatusBadRequest, gin.H{"error": "invalid date format, use YYYY-MM-DD"})
        return
    }
    
    schedule, err := h.scheduleService.GetScheduleByDate(date)
    if err != nil {
        c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
        return
    }
    
    // Convert to response format
    response := formatScheduleResponse(schedule)
    
    c.JSON(http.StatusOK, response)
}

// GetUpcomingSchedules gets upcoming schedules
func (h *ScheduleHandler) GetUpcomingSchedules(c *gin.Context) {
    schedules, err := h.scheduleService.GetUpcomingSchedules()
    if err != nil {
        c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
        return
    }
    
    // Convert to response format
    var response []models.ScheduleResponse
    for _, schedule := range schedules {
        response = append(response, formatScheduleResponse(schedule))
    }
    
    c.JSON(http.StatusOK, response)
}

// BookTimeSlot books a time slot for the current user
func (h *ScheduleHandler) BookTimeSlot(c *gin.Context) {
    // Get user ID from context
    userID, exists := c.Get("userID")
    if !exists {
        c.JSON(http.StatusUnauthorized, gin.H{"error": "unauthorized"})
        return
    }
    
    var input models.BookingRequest
    if err := c.ShouldBindJSON(&input); err != nil {
        c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
        return
    }
    
    // Parse date
    date, err := time.Parse("2006-01-02", input.Date)
    if err != nil {
        c.JSON(http.StatusBadRequest, gin.H{"error": "invalid date format, use YYYY-MM-DD"})
        return
    }
    
    // Book the time slot
    schedule, err := h.scheduleService.BookTimeSlot(date, input.StartTime, userID.(primitive.ObjectID))
    if err != nil {
        c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
        return
    }
    
    // Convert to response format
    response := formatScheduleResponse(schedule)
    
    c.JSON(http.StatusOK, response)
}

// CancelBooking cancels a booking
func (h *ScheduleHandler) CancelBooking(c *gin.Context) {
    // Get user ID from context
    userID, exists := c.Get("userID")
    if !exists {
        c.JSON(http.StatusUnauthorized, gin.H{"error": "unauthorized"})
        return
    }
    
    var input models.BookingRequest
    if err := c.ShouldBindJSON(&input); err != nil {
        c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
        return
    }
    
    // Parse date
    date, err := time.Parse("2006-01-02", input.Date)
    if err != nil {
        c.JSON(http.StatusBadRequest, gin.H{"error": "invalid date format, use YYYY-MM-DD"})
        return
    }
    
    // Cancel the booking
    schedule, err := h.scheduleService.CancelBooking(date, input.StartTime, userID.(primitive.ObjectID))
    if err != nil {
        c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
        return
    }
    
    // Convert to response format
    response := formatScheduleResponse(schedule)
    
    c.JSON(http.StatusOK, response)
}

// GetMyBookings gets all bookings for the current user
func (h *ScheduleHandler) GetMyBookings(c *gin.Context) {
    // Get user ID from context
    userID, exists := c.Get("userID")
    if !exists {
        c.JSON(http.StatusUnauthorized, gin.H{"error": "unauthorized"})
        return
    }
    
    bookings, err := h.scheduleService.GetUserBookings(userID.(primitive.ObjectID))
    if err != nil {
        c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
        return
    }
    
    c.JSON(http.StatusOK, bookings)
}

// formatScheduleResponse converts a Schedule to ScheduleResponse
func formatScheduleResponse(schedule *models.Schedule) models.ScheduleResponse {
    var timeSlots []models.TimeSlotResponse
    
    for _, slot := range schedule.TimeSlots {
        timeSlots = append(timeSlots, models.TimeSlotResponse{
            StartTime: slot.StartTime.Format("15:04"),
            EndTime:   slot.EndTime.Format("15:04"),
            Available: slot.UserID.IsZero(),
            UserID:    slot.UserID,
            Username:  slot.Username,
        })
    }
    
    return models.ScheduleResponse{
        ID:        schedule.ID,
        Date:      schedule.Date.Format("2006-01-02"),
        TimeSlots: timeSlots,
    }
}

// CreateSchedule creates a new schedule (admin only)
func (h *ScheduleHandler) CreateSchedule(c *gin.Context) {
    dateStr := c.Param("date") // Format: YYYY-MM-DD
    
    // Parse date
    date, err := time.Parse("2006-01-02", dateStr)
    if err != nil {
        c.JSON(http.StatusBadRequest, gin.H{"error": "invalid date format, use YYYY-MM-DD"})
        return
    }
    
    // Create schedule
    schedule, err := h.scheduleService.CreateDailySchedule(date)
    if err != nil {
        c.JSON(http.StatusInternalServerError, gin.H{"error": fmt.Sprintf("failed to create schedule: %v", err)})
        return
    }
    
    // Convert to response format
    response := formatScheduleResponse(schedule)
    
    c.JSON(http.StatusCreated, response)
}

// GetAllSchedules gets all schedules (admin only)
func (h *ScheduleHandler) GetAllSchedules(c *gin.Context) {
    schedules, err := h.scheduleService.GetAllSchedules()
    if err != nil {
        c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
        return
    }
    
    // Convert to response format
    var response []models.ScheduleResponse
    for _, schedule := range schedules {
        response = append(response, formatScheduleResponse(schedule))
    }
    
    c.JSON(http.StatusOK, response)
}