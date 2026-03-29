const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const path = require('path');
const errorHandler = require('./middleware/errorHandler');
const auth = require('./middleware/auth');

const app = express();

// Basic middleware
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cors());
app.use(helmet());
app.use(morgan('dev'));

// Static folder for uploads
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Public/User Routes (register/login/profile fetch)
app.use('/api/users', require('./routes/userRoutes'));

// Protected Routes (Firebase auth middleware applied)
app.use('/api/clients', auth, require('./routes/clientRoutes'));
app.use('/api/appointments', auth, require('./routes/appointmentRoutes'));
app.use('/api/tasks', auth, require('./routes/taskRoutes'));
app.use('/api/resources', auth, require('./routes/resourceRoutes'));

// Error handler
app.use(errorHandler);

module.exports = app;
