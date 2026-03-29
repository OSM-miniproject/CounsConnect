const express = require('express');
const router = express.Router();
const taskController = require('../controllers/taskController');

// Create new task (Counselor assigns to Patient)
router.post('/', taskController.createTask);

// Get all tasks for logged-in user
router.get('/', taskController.getMyTasks);

// Update task status or feedback
router.patch('/:taskId', taskController.updateTaskStatus);

// Get all tasks assigned by counselor (optional)
router.get('/counselor/:counselorId', taskController.getTasksByCounselor);

// Get all tasks for a specific patient (optional)
router.get('/patient/:patientId', taskController.getTasksByPatient);

module.exports = router;
