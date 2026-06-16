const mongoose = require('mongoose');

const NotificationSchema = new mongoose.Schema({
  group: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Group',
    required: true,
  },
  message: {
    type: String,
    required: true,
    trim: true,
  },
  type: {
    type: String,
    enum: [
      'expense_added',
      'expense_updated',
      'expense_deleted',
      'member_joined',
      'settlement_logged',
      'settlement_completed',
    ],
    required: true,
  },
  date: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model('Notification', NotificationSchema);
