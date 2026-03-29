const mongoose = require('mongoose');

const patientProfileSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  assignedCounselorId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  therapyPlan: { type: String },
  checkIns: [{
    date: { type: Date, default: Date.now },
    mood: { type: String },
    notes: { type: String }
  }],
  emergencyContact: {
    name: String,
    phone: String
  }
});

module.exports = mongoose.model('PatientProfile', patientProfileSchema);
