const express = require('express');
const router = express.Router();

router.use('/users', require('./userRoutes'));
router.use('/tasks', require('./taskRoutes'));
router.use('/appointments', require('./appointmentRoutes'));
router.use('/resources', require('./resourceRoutes'));

module.exports = router;
