package service

import (
    "errors"
    "time"

    "github.com/thundersp/backend/models"
    "github.com/thundersp/backend/repository/mongodb"
    "go.mongodb.org/mongo-driver/bson"
    "go.mongodb.org/mongo-driver/bson/primitive"
)

// AppointmentService handles appointment operations
type AppointmentService struct {
    appointmentRepo *mongodb.AppointmentRepository
    userRepo        *mongodb.UserRepository
}

// NewAppointmentService creates a new appointment service
func NewAppointmentService(appointmentRepo *mongodb.AppointmentRepository, userRepo *mongodb.UserRepository) *AppointmentService {
    return &AppointmentService{
        appointmentRepo: appointmentRepo,
        userRepo:        userRepo,
    }
}

// CreateAppointment creates a new appointment (counselor only)
func (s *AppointmentService) CreateAppointment(counselorID primitive.ObjectID, input models.AppointmentInput) (*models.Appointment, error) {
    // Validate patient exists
    patientID, err := primitive.ObjectIDFromHex(input.PatientID)
    if err != nil {
        return nil, errors.New("invalid patient ID")
    }

    patient, err := s.userRepo.FindByID(patientID)
    if err != nil {
        return nil, err
    }

    if patient == nil {
        return nil, errors.New("patient not found")
    }

    if patient.Role != "patient" {
        return nil, errors.New("specified user is not a patient")
    }

    // Validate time range
    if input.StartTime.After(input.EndTime) || input.StartTime.Equal(input.EndTime) {
        return nil, errors.New("end time must be after start time")
    }

    // Validate appointment duration (at least 30 minutes, max 2 hours)
    duration := input.EndTime.Sub(input.StartTime)
    if duration < 30*time.Minute || duration > 2*time.Hour {
        return nil, errors.New("appointment duration must be between 30 minutes and 2 hours")
    }

    // Create appointment
    appointment := models.Appointment{
        CounselorID: counselorID,
        PatientID:   patientID,
        StartTime:   input.StartTime,
        EndTime:     input.EndTime,
        Status:      "pending", // Default status
        Location:    input.Location,
        Notes:       input.Notes,
    }

    createdAppointment, err := s.appointmentRepo.Create(appointment)
    if err != nil {
        return nil, err
    }

    return createdAppointment, nil
}

// GetAppointmentByID retrieves an appointment by ID
func (s *AppointmentService) GetAppointmentByID(id primitive.ObjectID, userID primitive.ObjectID, role string) (*models.Appointment, error) {
    appointment, err := s.appointmentRepo.FindByID(id)
    if err != nil {
        return nil, err
    }

    if appointment == nil {
        return nil, errors.New("appointment not found")
    }

    // Check if user has permission to view this appointment
    if role == "patient" && appointment.PatientID != userID {
        return nil, errors.New("unauthorized to view this appointment")
    } else if role == "counselor" && appointment.CounselorID != userID {
        return nil, errors.New("unauthorized to view this appointment")
    }

    return appointment, nil
}

// UpdateAppointment updates an existing appointment (counselor only)
func (s *AppointmentService) UpdateAppointment(id primitive.ObjectID, counselorID primitive.ObjectID, input models.AppointmentUpdateInput) (*models.Appointment, error) {
    // Check if appointment exists and belongs to this counselor
    appointment, err := s.appointmentRepo.FindByID(id)
    if err != nil {
        return nil, err
    }

    if appointment == nil {
        return nil, errors.New("appointment not found")
    }

    if appointment.CounselorID != counselorID {
        return nil, errors.New("unauthorized to update this appointment")
    }

    // Prepare update
    update := bson.M{}

    // Only update time if both start and end times are provided
    if !input.StartTime.IsZero() && !input.EndTime.IsZero() {
        // Validate time range
        if input.StartTime.After(input.EndTime) || input.StartTime.Equal(input.EndTime) {
            return nil, errors.New("end time must be after start time")
        }

        // Validate appointment duration (at least 30 minutes, max 2 hours)
        duration := input.EndTime.Sub(input.StartTime)
        if duration < 30*time.Minute || duration > 2*time.Hour {
            return nil, errors.New("appointment duration must be between 30 minutes and 2 hours")
        }

        update["start_time"] = input.StartTime
        update["end_time"] = input.EndTime
    }

    if input.Status != "" {
        update["status"] = input.Status
    }

    if input.Location != "" {
        update["location"] = input.Location
    }

    if input.Notes != "" {
        update["notes"] = input.Notes
    }

    // Update appointment
    updatedAppointment, err := s.appointmentRepo.Update(id, update)
    if err != nil {
        return nil, err
    }

    return updatedAppointment, nil
}

// DeleteAppointment deletes an appointment (counselor only)
func (s *AppointmentService) DeleteAppointment(id primitive.ObjectID, counselorID primitive.ObjectID) error {
    // Check if appointment exists and belongs to this counselor
    appointment, err := s.appointmentRepo.FindByID(id)
    if err != nil {
        return err
    }

    if appointment == nil {
        return errors.New("appointment not found")
    }

    if appointment.CounselorID != counselorID {
        return errors.New("unauthorized to delete this appointment")
    }

    // Don't allow deletion if the appointment is confirmed
    if appointment.Status == "confirmed" {
        return errors.New("cannot delete a confirmed appointment, please cancel it first")
    }

    // Delete appointment
    return s.appointmentRepo.Delete(id)
}

// GetUpcomingAppointments retrieves upcoming appointments for the current user
func (s *AppointmentService) GetUpcomingAppointments(userID primitive.ObjectID, role string) ([]*models.Appointment, error) {
    if role == "counselor" {
        return s.appointmentRepo.FindUpcomingByCounselorID(userID)
    } else if role == "patient" {
        return s.appointmentRepo.FindUpcomingByPatientID(userID)
    }

    return nil, errors.New("invalid role")
}

// UpdateAppointmentStatus updates the status of an appointment (both counselor and patient can do this)
func (s *AppointmentService) UpdateAppointmentStatus(id primitive.ObjectID, userID primitive.ObjectID, role string, status string) (*models.Appointment, error) {
    // Check if appointment exists
    appointment, err := s.appointmentRepo.FindByID(id)
    if err != nil {
        return nil, err
    }

    if appointment == nil {
        return nil, errors.New("appointment not found")
    }

    // Check if user has permission to update this appointment
    if role == "patient" && appointment.PatientID != userID {
        return nil, errors.New("unauthorized to update this appointment")
    } else if role == "counselor" && appointment.CounselorID != userID {
        return nil, errors.New("unauthorized to update this appointment")
    }

    // Apply role-specific restrictions
    if role == "patient" {
        // Patients can only cancel appointments or confirm them
        if status != "cancelled" && status != "confirmed" {
            return nil, errors.New("patients can only cancel or confirm appointments")
        }

        // Patients cannot cancel appointments less than 24 hours before start time
        if status == "cancelled" {
            timeUntilAppointment := appointment.StartTime.Sub(time.Now())
            if timeUntilAppointment < 24*time.Hour {
                return nil, errors.New("appointments can only be cancelled at least 24 hours in advance")
            }
        }
    }

    // Counselors can mark appointments as completed only after the end time
    if role == "counselor" && status == "completed" {
        if time.Now().Before(appointment.EndTime) {
            return nil, errors.New("appointments can only be marked as completed after their scheduled end time")
        }
    }

    // Update appointment status
    updatedAppointment, err := s.appointmentRepo.UpdateStatus(id, status)
    if err != nil {
        return nil, err
    }

    return updatedAppointment, nil
}


// GetAllAppointmentsByPatient retrieves all appointments for a specific patient (counselor only)
func (s *AppointmentService) GetAllAppointmentsByPatient(patientID primitive.ObjectID, counselorID primitive.ObjectID) ([]*models.Appointment, error) {
    // Verify that the patient is assigned to this counselor
    // (This would require additional repository methods or checks which aren't fully implemented yet)
    // For now, we'll just check if appointments exist between these two

    appointments, err := s.appointmentRepo.FindByPatientID(patientID)
    if err != nil {
        return nil, err
    }

    // Filter appointments to only include those with this counselor
    var filteredAppointments []*models.Appointment
    for _, appointment := range appointments {
        if appointment.CounselorID == counselorID {
            filteredAppointments = append(filteredAppointments, appointment)
        }
    }

    return filteredAppointments, nil
}