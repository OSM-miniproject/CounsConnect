const Task = require('../models/Task');
const User = require('../models/User');

// POST /api/tasks
const createTask = async (req, res) => {
  try {
    const { title, description, patientId, frequency, deadline } = req.body;

    const counselor = await User.findOne({ uid: req.user.uid });
    if (!counselor || counselor.role !== 'counselor') {
      return res.status(403).json({ message: 'Access denied. Not a counselor.' });
    }

    const task = new Task({
      title,
      description,
      frequency,
      deadline,
      patientId,
      counselorId: counselor._id
    });

    await task.save();
    res.status(201).json(task);
  } catch (err) {
    res.status(500).json({ message: 'Error creating task', error: err.message });
  }
};

// GET /api/tasks
const getMyTasks = async (req, res) => {
  try {
    const currentUser = await User.findOne({ uid: req.user.uid });

    if (!currentUser) return res.status(404).json({ message: 'User not found' });

    let tasks;
    if (currentUser.role === 'patient') {
      tasks = await Task.find({ patientId: currentUser._id }).sort({ deadline: 1 });
    } else if (currentUser.role === 'counselor') {
      tasks = await Task.find({ counselorId: currentUser._id }).sort({ deadline: 1 });
    } else {
      return res.status(403).json({ message: 'Invalid role' });
    }

    res.status(200).json(tasks);
  } catch (err) {
    res.status(500).json({ message: 'Error retrieving tasks', error: err.message });
  }
};

// PATCH /api/tasks/:taskId
const updateTaskStatus = async (req, res) => {
  try {
    const { taskId } = req.params;
    const { status, feedback } = req.body;

    const task = await Task.findById(taskId);
    if (!task) return res.status(404).json({ message: 'Task not found' });

    if (status) task.status = status;
    if (feedback) task.feedback = feedback;

    await task.save();
    res.status(200).json(task);
  } catch (err) {
    res.status(500).json({ message: 'Error updating task', error: err.message });
  }
};

// GET /api/tasks/counselor/:counselorId
const getTasksByCounselor = async (req, res) => {
  try {
    const tasks = await Task.find({ counselorId: req.params.counselorId }).sort({ createdAt: -1 });
    res.status(200).json(tasks);
  } catch (err) {
    res.status(500).json({ message: 'Error fetching tasks', error: err.message });
  }
};

// GET /api/tasks/patient/:patientId
const getTasksByPatient = async (req, res) => {
  try {
    const tasks = await Task.find({ patientId: req.params.patientId }).sort({ createdAt: -1 });
    res.status(200).json(tasks);
  } catch (err) {
    res.status(500).json({ message: 'Error fetching tasks', error: err.message });
  }
};

module.exports = {
  createTask,
  getMyTasks,
  updateTaskStatus,
  getTasksByCounselor,
  getTasksByPatient
};
