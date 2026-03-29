const mongoose = require('mongoose');

const appointmentSchema = new mongoose.Schema({
  counselorId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  patientId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  startTime: { type: Date },
  endTime: { type: Date },
  status: {
    type: String,
    enum: ['pending', 'confirmed', 'completed', 'cancelled'],
    default: 'pending'
  },
  location: { type: String, enum: ['video', 'in-person'], default: 'video' },
  notes: { type: String }
});

module.exports = mongoose.model('Appointment', appointmentSchema);
