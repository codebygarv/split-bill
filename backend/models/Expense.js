const mongoose = require('mongoose');

const ExpenseSchema = new mongoose.Schema({
  group: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Group',
    required: true,
  },
  amount: {
    type: Number,
    required: [true, 'Please add an amount'],
    min: [0.01, 'Amount must be greater than zero'],
  },
  category: {
    type: String,
    required: [true, 'Please select a category'],
    enum: [
      'Vegetables',
      'Grocery',
      'Rent',
      'Electricity',
      'Water',
      'Internet',
      'Transport',
      'Entertainment',
      'Other',
    ],
    default: 'Other',
  },
  notes: {
    type: String,
    trim: true,
    default: '',
  },
  paidBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  splitBetween: [
    {
      user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
      },
      amount: {
        type: Number,
        required: true,
      },
    },
  ],
  date: {
    type: Date,
    default: Date.now,
  },
  receiptImage: {
    type: String,
    default: '',
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model('Expense', ExpenseSchema);
