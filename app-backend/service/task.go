package service

import (
    "errors"
    "time"

    "github.com/thundersp/backend/models"
    "github.com/thundersp/backend/repository/mongodb"
    "go.mongodb.org/mongo-driver/bson/primitive"
)

// TaskService handles business logic for tasks
type TaskService struct {
    taskRepo *mongodb.TaskRepository
    userRepo *mongodb.UserRepository
}

// NewTaskService creates a new task service
func NewTaskService(taskRepo *mongodb.TaskRepository, userRepo *mongodb.UserRepository) *TaskService {
    return &TaskService{
        taskRepo: taskRepo,
        userRepo: userRepo,
    }
}

// CreateTask creates a new task
func (s *TaskService) CreateTask(counselorID primitive.ObjectID, input models.TaskInput) (*models.Task, error) {
    // Verify counselor exists
    counselor, err := s.userRepo.FindByID(counselorID)
    if err != nil {
        return nil, err
    }
    if counselor == nil || counselor.Role != "counselor" {
        return nil, errors.New("counselor not found")
    }

    // Verify patient exists
    patientID, err := primitive.ObjectIDFromHex(input.PatientID)
    if err != nil {
        return nil, errors.New("invalid patient ID")
    }
    patient, err := s.userRepo.FindByID(patientID)
    if err != nil {
        return nil, err
    }
    if patient == nil || patient.Role != "patient" {
        return nil, errors.New("patient not found")
    }

    // Parse deadline
    deadline, err := time.Parse(time.RFC3339, input.Deadline)
    if err != nil {
        return nil, errors.New("invalid deadline format, use YYYY-MM-DDTHH:MM:SSZ")
    }

    // Create task
    task := &models.Task{
        PatientID:   patientID,
        CounselorID: counselorID,
        Title:       input.Title,
        Description: input.Description,
        Frequency:   input.Frequency,
        Deadline:    deadline,
        Status:      "pending",
        Feedback:    "N/A",
    }

    return s.taskRepo.Create(task)
}

// GetTaskByID gets a task by ID
func (s *TaskService) GetTaskByID(id primitive.ObjectID, userID primitive.ObjectID) (*models.Task, error) {
    task, err := s.taskRepo.FindByID(id)
    if err != nil {
        return nil, err
    }
    if task == nil {
        return nil, errors.New("task not found")
    }

    // Verify user has access to this task (either the patient or the counselor)
    if task.PatientID != userID && task.CounselorID != userID {
        return nil, errors.New("unauthorized access to task")
    }

    return task, nil
}
// Add this method to your TaskService

// GetAllTasks retrieves all tasks without user filtering
func (s *TaskService) GetAllTasks() ([]models.Task, error) {
    // Fetch all tasks from repository without user filtering
    return s.taskRepo.FindAll()
}

// GetTasks gets all tasks for a user
func (s *TaskService) GetTasks(userID primitive.ObjectID, role string) ([]*models.Task, error) {
    if role == "patient" {
        return s.taskRepo.FindByPatientID(userID)
    } else if role == "counselor" {
        return s.taskRepo.FindByCounselorID(userID)
    }
    return nil, errors.New("invalid user role")
}

// GetPatientTasks gets all tasks for a specific patient (counselor access only)
func (s *TaskService) GetPatientTasks(patientID primitive.ObjectID, counselorID primitive.ObjectID) ([]*models.Task, error) {
    // First check if any tasks exist for this patient with this counselor
    tasks, err := s.taskRepo.FindByPatientID(patientID)
    if err != nil {
        return nil, err
    }

    // Filter tasks to only include ones created by this counselor
    var counselorTasks []*models.Task
    for _, task := range tasks {
        if task.CounselorID == counselorID {
            counselorTasks = append(counselorTasks, task)
        }
    }

    return counselorTasks, nil
}

// GetUpcomingTasks gets upcoming tasks for a user
func (s *TaskService) GetUpcomingTasks(userID primitive.ObjectID, isPatient bool) ([]*models.Task, error) {
    return s.taskRepo.FindUpcoming(userID, isPatient)
}

// UpdateTask updates a task
func (s *TaskService) UpdateTask(taskID primitive.ObjectID, counselorID primitive.ObjectID, input models.TaskUpdateInput) (*models.Task, error) {
    // Verify task exists and belongs to this counselor
    task, err := s.taskRepo.FindByID(taskID)
    if err != nil {
        return nil, err
    }
    if task == nil {
        return nil, errors.New("task not found")
    }
    if task.CounselorID != counselorID {
        return nil, errors.New("unauthorized: only the counselor who created the task can update it")
    }

    // Build updates
    updates := make(map[string]interface{})
    if input.Title != "" {
        updates["title"] = input.Title
    }
    if input.Description != "" {
        updates["description"] = input.Description
    }
    if input.Frequency != "" {
        updates["frequency"] = input.Frequency
    }
    if input.Deadline != "" {
        deadline, err := time.Parse(time.RFC3339, input.Deadline)
        if err != nil {
            return nil, errors.New("invalid deadline format, use YYYY-MM-DDTHH:MM:SSZ")
        }
        updates["deadline"] = deadline
    }
    if input.Status != "" {
        updates["status"] = input.Status
    }

    return s.taskRepo.Update(taskID, updates)
}

// UpdateTaskStatus updates the status of a task
func (s *TaskService) UpdateTaskStatus(taskID primitive.ObjectID, userID primitive.ObjectID, status string) (*models.Task, error) {
    // Verify task exists and user has access
    _, err := s.GetTaskByID(taskID, userID)
    if err != nil {
        return nil, err
    }

    return s.taskRepo.UpdateStatus(taskID, status)
}

// AddFeedback adds or updates feedback for a task
func (s *TaskService) AddFeedback(taskID primitive.ObjectID, counselorID primitive.ObjectID, feedback string) (*models.Task, error) {
    // Verify task exists and belongs to this counselor
    task, err := s.taskRepo.FindByID(taskID)
    if err != nil {
        return nil, err
    }
    if task == nil {
        return nil, errors.New("task not found")
    }
    if task.CounselorID != counselorID {
        return nil, errors.New("unauthorized: only the counselor who created the task can add feedback")
    }

    return s.taskRepo.AddFeedback(taskID, feedback)
}

// DeleteTask deletes a task
func (s *TaskService) DeleteTask(taskID primitive.ObjectID, counselorID primitive.ObjectID) error {
    // Verify task exists and belongs to this counselor
    task, err := s.taskRepo.FindByID(taskID)
    if err != nil {
        return err
    }
    if task == nil {
        return errors.New("task not found")
    }
    if task.CounselorID != counselorID {
        return errors.New("unauthorized: only the counselor who created the task can delete it")
    }

    return s.taskRepo.Delete(taskID)
}