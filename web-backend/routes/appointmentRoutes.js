const express = require('express');
const router = express.Router();
const appointmentController = require('../controllers/appointmentController');

// Create new appointment
router.post('/', appointmentController.createAppointment);

// Get all appointments for logged-in user
router.get('/', appointmentController.getMyAppointments);

// Update appointment status (e.g., confirm, cancel, complete)
router.patch('/:id', appointmentController.updateAppointmentStatus);

module.exports = router;
