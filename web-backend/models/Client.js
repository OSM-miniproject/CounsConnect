const mongoose = require('mongoose');

const ClientSchema = new mongoose.Schema({
  counselorId: {
    type: String,
    required: true,
    index: true
  },
  name: {
    type: String,
    required: true
  },
  age: {
    type: Number,
    required: true
  },
  gender: {
    type: String,
    enum: ['Male', 'Female', 'Transgender', 'Other'],
    required: true
  },
  education: {
    type: String
  },
  maritalStatus: {
    type: String,
    enum: ['Married', 'Unmarried', 'Divorced', 'Widowed']
  },
  profession: {
    type: String
  },
  issues: [{
    type: String
  }],
  symptoms: [{
    type: String
  }],
  wantsGrowth: {
    type: Boolean,
    default: false
  },
  swot: {
    strengths: String,
    weaknesses: String,
    opportunities: String,
    threats: String
  },
  notes: {
    type: String,
    default: ''
  },
  status: {
    type: String,
    enum: ['Active', 'Inactive', 'On Hold'],
    default: 'Active'
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('Client', ClientSchema);