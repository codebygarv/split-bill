const express = require('express');
const router = express.Router();
const {
  createGroup,
  joinGroup,
  getGroupDetails,
  getGroupDashboard,
} = require('../controllers/groupController');
const { protect } = require('../middlewares/authMiddleware');

router.route('/')
  .post(protect, createGroup);

router.post('/join', protect, joinGroup);

router.route('/:id')
  .get(protect, getGroupDetails);

router.route('/:id/dashboard')
  .get(protect, getGroupDashboard);

module.exports = router;
