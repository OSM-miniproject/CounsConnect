const User = require('../models/User');
const PatientProfile = require('../models/PatientProfile');
const CounselorProfile = require('../models/CounselorProfile');

// GET /api/users/me
const getCurrentUser = async (req, res) => {
  try {
    const user = await User.findOne({ uid: req.user.uid });
    if (!user) return res.status(404).json({ message: 'User not found' });

    // Return user data with role
    res.status(200).json({
      id: user._id,
      uid: user.uid,
      role: user.role,  // Ensure role is included
      name: user.name,
      email: user.email
    });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

// POST /api/users/register
const registerUser = async (req, res) => {
  try {
    const { role, name, email } = req.body;
    const uid = req.user.uid;

    let existing = await User.findOne({ uid });
    if (existing) return res.status(400).json({ message: 'User already exists' });

    const newUser = new User({ uid, role, name, email });
    await newUser.save();

    // Create role-specific profile
    if (role === 'patient') {
      const profile = new PatientProfile({ userId: newUser._id });
      await profile.save();
    } else if (role === 'counselor') {
      const profile = new CounselorProfile({ userId: newUser._id });
      await profile.save();
    }

    res.status(201).json(newUser);
  } catch (err) {
    res.status(500).json({ message: 'Registration error', error: err.message });
  }
};

// GET /api/users/patients
const getPatients = async (req, res) => {
  try {
    const patients = await User.find({ role: 'patient' });
    res.status(200).json(patients);
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch patients', error: err.message });
  }
};

// GET /api/users/counselors
const getCounselors = async (req, res) => {
  try {
    const counselors = await User.find({ role: 'counselor' });
    res.status(200).json(counselors);
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch counselors', error: err.message });
  }
};

module.exports = {
  registerUser,
  getCurrentUser,
  getPatients,
  getCounselors,
};
