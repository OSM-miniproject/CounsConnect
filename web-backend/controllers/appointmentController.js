const Appointment = require('../models/Appointment');
const User = require('../models/User');

// POST /api/appointments
const createAppointment = async (req, res) => {
  try {
    const { counselorId, startTime, endTime, location, notes } = req.body;

    const patient = await User.findOne({ uid: req.user.uid });
    if (!patient || patient.role !== 'patient') {
      return res.status(403).json({ message: 'Only patients can request appointments' });
    }

    const appointment = new Appointment({
      counselorId,
      patientId: patient._id,
      startTime,
      endTime,
      location,
      notes,
      status: 'pending'
    });

    await appointment.save();
    res.status(201).json(appointment);
  } catch (err) {
    res.status(500).json({ message: 'Error creating appointment', error: err.message });
  }
};

// GET /api/appointments
const getMyAppointments = async (req, res) => {
  try {
    const user = await User.findOne({ uid: req.user.uid });

    if (!user) return res.status(404).json({ message: 'User not found' });

    const queryKey = user.role === 'counselor' ? 'counselorId' : 'patientId';
    const appointments = await Appointment.find({ [queryKey]: user._id })
      .sort({ startTime: 1 })
      .populate('counselorId patientId');

    res.status(200).json(appointments);
  } catch (err) {
    res.status(500).json({ message: 'Error retrieving appointments', error: err.message });
  }
};

// PATCH /api/appointments/:id
const updateAppointmentStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, notes } = req.body;

    const appointment = await Appointment.findById(id);
    if (!appointment) return res.status(404).json({ message: 'Appointment not found' });

    if (status) appointment.status = status;
    if (notes) appointment.notes = notes;

    await appointment.save();
    res.status(200).json(appointment);
  } catch (err) {
    res.status(500).json({ message: 'Error updating appointment', error: err.message });
  }
};

module.exports = {
  createAppointment,
  getMyAppointments,
  updateAppointmentStatus
};
