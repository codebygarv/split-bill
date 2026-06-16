const express = require('express');
const router = express.Router();
const {
  addExpense,
  updateExpense,
  deleteExpense,
  getGroupExpenses,
} = require('../controllers/expenseController');
const { protect } = require('../middlewares/authMiddleware');

router.route('/')
  .post(protect, addExpense);

router.route('/:id')
  .put(protect, updateExpense)
  .delete(protect, deleteExpense);

router.route('/group/:groupId')
  .get(protect, getGroupExpenses);

module.exports = router;
