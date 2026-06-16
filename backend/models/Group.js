const mongoose = require('mongoose');

const GroupSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Please add a group name'],
    trim: true,
  },
  type: {
    type: String,
    required: [true, 'Please select a group type'],
    enum: ['Family', 'Flatmates', 'Friends', 'Trip', 'Office', 'Custom'],
    default: 'Custom',
  },
  code: {
    type: String,
    required: true,
    unique: true,
    trim: true,
  },
  admin: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  members: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model('Group', GroupSchema);
