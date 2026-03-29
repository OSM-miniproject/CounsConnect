package service

import (
    "errors"
    "time"

    "github.com/thundersp/backend/models"
    "github.com/thundersp/backend/repository/mongodb"
    "go.mongodb.org/mongo-driver/bson/primitive"
)

// ScheduleService handles schedule operations
type ScheduleService struct {
    scheduleRepo *mongodb.ScheduleRepository
    userRepo     *mongodb.UserRepository
}

// NewScheduleService creates a new schedule service
func NewScheduleService(scheduleRepo *mongodb.ScheduleRepository, userRepo *mongodb.UserRepository) *ScheduleService {
    return &ScheduleService{
        scheduleRepo: scheduleRepo,
        userRepo:     userRepo,
    }
}

// CreateDailySchedule creates a new daily schedule
func (s *ScheduleService) CreateDailySchedule(date time.Time) (*models.Schedule, error) {
    // Check if schedule already exists for this date
    existingSchedule, err := s.scheduleRepo.FindByDate(date)
    if err != nil {
        return nil, err
    }

    if existingSchedule != nil {
        return existingSchedule, nil
    }

    // Create time slots from 9 AM to 6 PM (9 slots)
    timeSlots := make([]models.TimeSlot, 9)
    for i := 0; i < 9; i++ {
        startTime := time.Date(date.Year(), date.Month(), date.Day(), 9+i, 0, 0, 0, date.Location())
        endTime := time.Date(date.Year(), date.Month(), date.Day(), 10+i, 0, 0, 0, date.Location())

        timeSlots[i] = models.TimeSlot{
            StartTime: startTime,
            EndTime:   endTime,
        }
    }

    // Create schedule
    schedule := models.Schedule{
        Date:      date,
        TimeSlots: timeSlots,
    }

    createdSchedule, err := s.scheduleRepo.Create(schedule)
    if err != nil {
        return nil, err
    }

    return createdSchedule, nil
}

// GetScheduleByDate retrieves a schedule for a specific date
func (s *ScheduleService) GetScheduleByDate(date time.Time) (*models.Schedule, error) {
    schedule, err := s.scheduleRepo.FindByDate(date)
    if err != nil {
        return nil, err
    }

    if schedule == nil {
        // Create schedule for this date if it doesn't exist
        return s.CreateDailySchedule(date)
    }

    return schedule, nil
}

// GetAllSchedules retrieves all schedules
func (s *ScheduleService) GetAllSchedules() ([]*models.Schedule, error) {
    return s.scheduleRepo.FindAll()
}

// GetUpcomingSchedules retrieves upcoming schedules
func (s *ScheduleService) GetUpcomingSchedules() ([]*models.Schedule, error) {
    return s.scheduleRepo.FindUpcoming()
}

// BookTimeSlot books a time slot for a user
func (s *ScheduleService) BookTimeSlot(date time.Time, startTimeStr string, userID primitive.ObjectID) (*models.Schedule, error) {
    // Ensure the schedule for the date exists, create if not
    _, err := s.GetScheduleByDate(date)
    if err != nil {
        return nil, errors.New("failed to get or create schedule for the date: " + err.Error())
    }

    // Parse time
    layout := "15:04" // 24-hour format
    startTime, err := time.Parse(layout, startTimeStr)
    if err != nil {
        return nil, errors.New("invalid time format, use HH:MM (24-hour)")
    }

    // Set the date part of the time
    startTime = time.Date(date.Year(), date.Month(), date.Day(), startTime.Hour(), startTime.Minute(), 0, 0, date.Location())

    // Validate time (must be between 9 AM and 5 PM for the start time)
    hour := startTime.Hour()
    if hour < 9 || hour > 17 {
        return nil, errors.New("time slot must be between 9:00 and 17:00")
    }

    // Get the user
    user, err := s.userRepo.FindByID(userID)
    if err != nil {
        return nil, err
    }

    if user == nil {
        return nil, errors.New("user not found")
    }

    // Book the time slot using the repository function
    return s.scheduleRepo.BookTimeSlot(date, startTime, userID, user.Username)
}

// CancelBooking cancels a booking
func (s *ScheduleService) CancelBooking(date time.Time, startTimeStr string, userID primitive.ObjectID) (*models.Schedule, error) {
    // Parse time
    layout := "15:04" // 24-hour format
    startTime, err := time.Parse(layout, startTimeStr)
    if err != nil {
        return nil, errors.New("invalid time format, use HH:MM (24-hour)")
    }

    // Set the date part of the time
    startTime = time.Date(date.Year(), date.Month(), date.Day(), startTime.Hour(), startTime.Minute(), 0, 0, date.Location())

    // Cancel the booking
    return s.scheduleRepo.CancelBooking(date, startTime, userID)
}

// GetUserBookings gets all bookings for a user
func (s *ScheduleService) GetUserBookings(userID primitive.ObjectID) ([]models.TimeSlotResponse, error) {
    // Get all schedules
    schedules, err := s.scheduleRepo.FindAll()
    if err != nil {
        return nil, err
    }

    var userBookings []models.TimeSlotResponse

    // Find all bookings for this user
    for _, schedule := range schedules {
        for _, slot := range schedule.TimeSlots {
            if slot.UserID == userID {
                booking := models.TimeSlotResponse{
                    StartTime: slot.StartTime.Format("2006-01-02 15:04"),
                    EndTime:   slot.EndTime.Format("2006-01-02 15:04"),
                    Available: false,
                    UserID:    slot.UserID,
                    Username:  slot.Username,
                }
                userBookings = append(userBookings, booking)
            }
        }
    }

    return userBookings, nil
}