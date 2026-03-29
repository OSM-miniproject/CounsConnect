const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const auth = require('../middleware/auth');

// Register user profile (first-time sign-in)
router.post('/register', auth, userController.registerUser);

// Get current user profile (based on Firebase token)
router.get('/me', auth, userController.getCurrentUser);

// Get all patients (for counselors)
router.get('/patients', auth, userController.getPatients);

// Get all counselors (for admin/future use)
router.get('/counselors', auth, userController.getCounselors);

module.exports = router;
