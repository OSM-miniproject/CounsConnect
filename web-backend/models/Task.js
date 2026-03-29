const mongoose = require('mongoose');

const taskSchema = new mongoose.Schema({
  patientId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  counselorId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  title: { type: String },
  description: { type: String },
  frequency: { type: String, enum: ['weekly', 'biweekly', 'monthly'] },
  deadline: { type: Date },
  status: { type: String, enum: ['pending', 'completed', 'missed'], default: 'pending' },
  feedback: { type: String },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Task', taskSchema);
