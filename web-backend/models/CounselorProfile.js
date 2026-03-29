const mongoose = require('mongoose');

const counselorProfileSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  specialties: [String],
  availability: [{
    day: String, // e.g., "Monday"
    startTime: String, // e.g., "09:00"
    endTime: String // e.g., "17:00"
  }]
});

module.exports = mongoose.model('CounselorProfile', counselorProfileSchema);
