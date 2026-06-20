const express = require('express');
const router = express.Router();
const {
  registerUser,
  loginUser,
  verifyOtp,
  resendOtp,
  getUserProfile,
  updateUserProfile,
  changePassword,
  savePushToken,
  removePushToken,
  sendFeedback,
} = require('../controllers/authController');
const { protect } = require('../middlewares/authMiddleware');

router.post('/register', registerUser);
router.post('/login', loginUser);
router.post('/verify-otp', verifyOtp);
router.post('/resend-otp', resendOtp);
router.route('/profile')
  .get(protect, getUserProfile)
  .put(protect, updateUserProfile);
router.put('/password', protect, changePassword);
router.post('/push-token', protect, savePushToken);
router.post('/logout-push-token', protect, removePushToken);
router.post('/feedback', protect, sendFeedback);

module.exports = router;
