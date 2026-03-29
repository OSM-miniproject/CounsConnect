package handlers

import (
    "net/http"

    "github.com/gin-gonic/gin"
    "github.com/thundersp/backend/models"
    "github.com/thundersp/backend/service"
    "go.mongodb.org/mongo-driver/bson/primitive"
)

// AppointmentHandler handles appointment operations
type AppointmentHandler struct {
    appointmentService *service.AppointmentService
}

// NewAppointmentHandler creates a new appointment handler
func NewAppointmentHandler(appointmentService *service.AppointmentService) *AppointmentHandler {
    return &AppointmentHandler{
        appointmentService: appointmentService,
    }
}

// CreateAppointment creates a new appointment (counselor only)
func (h *AppointmentHandler) CreateAppointment(c *gin.Context) {
    userID, exists := c.Get("userID")
    if !exists {
        c.JSON(http.StatusUnauthorized, gin.H{"error": "unauthorized"})
        return
    }

    role, exists := c.Get("role")
    if !exists || role != "counselor" {
        c.JSON(http.StatusForbidden, gin.H{"error": "counselor access required"})
        return
    }

    var input models.AppointmentInput
    if err := c.ShouldBindJSON(&input); err != nil {
        c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
        return
    }

    appointment, err := h.appointmentService.CreateAppointment(userID.(primitive.ObjectID), input)
    if err != nil {
        c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
        return
    }

    c.JSON(http.StatusCreated, appointment)
}

// GetAppointmentByID retrieves an appointment by ID
func (h *AppointmentHandler) GetAppointmentByID(c *gin.Context) {
    userID, exists := c.Get("userID")
    if !exists {
        c.JSON(http.StatusUnauthorized, gin.H{"error": "unauthorized"})
        return
    }

    role, exists := c.Get("role")
    if !exists {
        c.JSON(http.StatusUnauthorized, gin.H{"error": "unauthorized"})
        return
    }

    id := c.Param("id")
    appointmentID, err := primitive.ObjectIDFromHex(id)
    if err != nil {
        c.JSON(http.StatusBadRequest, gin.H{"error": "invalid appointment ID"})
        return
    }

    appointment, err := h.appointmentService.GetAppointmentByID(appointmentID, userID.(primitive.ObjectID), role.(string))
    if err != nil {
        c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
        return
    }

    c.JSON(http.StatusOK, appointment)
}

// UpdateAppointment updates an appointment (counselor only)
func (h *AppointmentHandler) UpdateAppointment(c *gin.Context) {
    userID, exists := c.Get("userID")
    if !exists {
        c.JSON(http.StatusUnauthorized, gin.H{"error": "unauthorized"})
        return
    }

    role, exists := c.Get("role")
    if !exists || role != "counselor" {
        c.JSON(http.StatusForbidden, gin.H{"error": "counselor access required"})
        return
    }

    id := c.Param("id")
    appointmentID, err := primitive.ObjectIDFromHex(id)
    if err != nil {
        c.JSON(http.StatusBadRequest, gin.H{"error": "invalid appointment ID"})
        return
    }

    var input models.AppointmentUpdateInput
    if err := c.ShouldBindJSON(&input); err != nil {
        c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
        return
    }

    appointment, err := h.appointmentService.UpdateAppointment(appointmentID, userID.(primitive.ObjectID), input)
    if err != nil {
        c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
        return
    }

    c.JSON(http.StatusOK, appointment)
}

// DeleteAppointment deletes an appointment (counselor only)
func (h *AppointmentHandler) DeleteAppointment(c *gin.Context) {
    userID, exists := c.Get("userID")
    if !exists {
        c.JSON(http.StatusUnauthorized, gin.H{"error": "unauthorized"})
        return
    }

    role, exists := c.Get("role")
    if !exists || role != "counselor" {
        c.JSON(http.StatusForbidden, gin.H{"error": "counselor access required"})
        return
    }

    id := c.Param("id")
    appointmentID, err := primitive.ObjectIDFromHex(id)
    if err != nil {
        c.JSON(http.StatusBadRequest, gin.H{"error": "invalid appointment ID"})
        return
    }

    err = h.appointmentService.DeleteAppointment(appointmentID, userID.(primitive.ObjectID))
    if err != nil {
        c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
        return
    }

    c.JSON(http.StatusOK, gin.H{"message": "appointment deleted successfully"})
}

// GetUpcomingAppointments retrieves upcoming appointments for the current user
func (h *AppointmentHandler) GetUpcomingAppointments(c *gin.Context) {
    userID, exists := c.Get("userID")
    if !exists {
        c.JSON(http.StatusUnauthorized, gin.H{"error": "unauthorized"})
        return
    }

    role, exists := c.Get("role")
    if !exists {
        c.JSON(http.StatusUnauthorized, gin.H{"error": "unauthorized"})
        return
    }

    appointments, err := h.appointmentService.GetUpcomingAppointments(userID.(primitive.ObjectID), role.(string))
    if err != nil {
        c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
        return
    }

    c.JSON(http.StatusOK, appointments)
}

// UpdateAppointmentStatus updates the status of an appointment
func (h *AppointmentHandler) UpdateAppointmentStatus(c *gin.Context) {
    userID, exists := c.Get("userID")
    if !exists {
        c.JSON(http.StatusUnauthorized, gin.H{"error": "unauthorized"})
        return
    }

    role, exists := c.Get("role")
    if !exists {
        c.JSON(http.StatusUnauthorized, gin.H{"error": "unauthorized"})
        return
    }

    id := c.Param("id")
    appointmentID, err := primitive.ObjectIDFromHex(id)
    if err != nil {
        c.JSON(http.StatusBadRequest, gin.H{"error": "invalid appointment ID"})
        return
    }

    var input models.AppointmentStatusUpdateInput
    if err := c.ShouldBindJSON(&input); err != nil {
        c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
        return
    }

    appointment, err := h.appointmentService.UpdateAppointmentStatus(appointmentID, userID.(primitive.ObjectID), role.(string), input.Status)
    if err != nil {
        c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
        return
    }

    c.JSON(http.StatusOK, appointment)
}

// GetPatientAppointments retrieves all appointments for a specific patient (counselor only)
func (h *AppointmentHandler) GetPatientAppointments(c *gin.Context) {
    userID, exists := c.Get("userID")
    if !exists {
        c.JSON(http.StatusUnauthorized, gin.H{"error": "unauthorized"})
        return
    }

    role, exists := c.Get("role")
    if !exists || role != "counselor" {
        c.JSON(http.StatusForbidden, gin.H{"error": "counselor access required"})
        return
    }

    patientID := c.Param("patientId")
    patientObjID, err := primitive.ObjectIDFromHex(patientID)
    if err != nil {
        c.JSON(http.StatusBadRequest, gin.H{"error": "invalid patient ID"})
        return
    }

    appointments, err := h.appointmentService.GetAllAppointmentsByPatient(patientObjID, userID.(primitive.ObjectID))
    if err != nil {
        c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
        return
    }

    c.JSON(http.StatusOK, appointments)
}