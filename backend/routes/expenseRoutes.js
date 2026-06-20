const express = require('express');
const router = express.Router();
const {
  addExpense,
  updateExpense,
  deleteExpense,
  getGroupExpenses,
  getExpenseById,
} = require('../controllers/expenseController');
const { protect } = require('../middlewares/authMiddleware');

router.route('/')
  .post(protect, addExpense);

router.route('/:id')
  .get(protect, getExpenseById)
  .put(protect, updateExpense)
  .delete(protect, deleteExpense);

router.route('/group/:groupId')
  .get(protect, getGroupExpenses);

module.exports = router;
