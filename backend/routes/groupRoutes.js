const express = require('express');
const router = express.Router();
const {
  createGroup,
  joinGroup,
  getGroupDetails,
  getGroupDashboard,
  deleteGroup,
} = require('../controllers/groupController');
const { protect } = require('../middlewares/authMiddleware');

router.route('/')
  .post(protect, createGroup);

router.post('/join', protect, joinGroup);

router.route('/:id')
  .get(protect, getGroupDetails)
  .delete(protect, deleteGroup);

router.route('/:id/dashboard')
  .get(protect, getGroupDashboard);

module.exports = router;
