const express = require('express');
const router = express.Router();
const { getGroupNotifications } = require('../controllers/notificationController');
const { protect } = require('../middlewares/authMiddleware');

router.route('/group/:groupId')
  .get(protect, getGroupNotifications);

module.exports = router;
