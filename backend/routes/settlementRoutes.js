const express = require('express');
const router = express.Router();
const {
  logSettlement,
  approveSettlement,
  getGroupSettlements,
} = require('../controllers/settlementController');
const { protect } = require('../middlewares/authMiddleware');

router.route('/')
  .post(protect, logSettlement);

router.route('/:id/approve')
  .put(protect, approveSettlement);

router.route('/group/:groupId')
  .get(protect, getGroupSettlements);

module.exports = router;
