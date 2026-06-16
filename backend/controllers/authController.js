const jwt = require('jsonwebtoken');
const User = require('../models/User');
const nodemailer = require('nodemailer');

let transporter;
const setupTransporter = async () => {
  if (process.env.SMTP_HOST) {
    transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: process.env.SMTP_PORT,
      secure: process.env.SMTP_SECURE === 'true', // true for 465, false for other ports
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });
  } else {
    try {
      const testAccount = await nodemailer.createTestAccount();
      transporter = nodemailer.createTransport({
        host: "smtp.ethereal.email",
        port: 587,
        secure: false,
        auth: {
          user: testAccount.user,
          pass: testAccount.pass,
        },
      });
      console.log('Using Ethereal email for testing. User:', testAccount.user);
    } catch (e) {
      console.error('Failed to create Ethereal account:', e);
    }
  }
};
setupTransporter();

const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET || 'super_secret_jwt_key_split_bill_app_2026', {
    expiresIn: '30d',
  });
};

const generateOTP = () => Math.floor(100000 + Math.random() * 900000).toString();

const sendOTPEmail = async (email, otp) => {
  if (!transporter) await setupTransporter();
  
  const mailOptions = {
    from: '"SplitBill App" <noreply@splitbill.com>',
    to: email,
    subject: 'Your Verification Code',
    text: `Your OTP for SplitBill is: ${otp}. It will expire in 10 minutes.`,
    html: `<h3>Welcome to SplitBill!</h3><p>Your verification code is: <strong>${otp}</strong></p><p>It will expire in 10 minutes.</p>`,
  };

  const info = await transporter.sendMail(mailOptions);
  console.log('OTP Email sent: %s', info.messageId);
  if (info.messageId && !process.env.SMTP_HOST) {
     console.log('Preview URL: %s', nodemailer.getTestMessageUrl(info));
  }
};

// @desc    Register a new user
// @route   POST /api/auth/register
// @access  Public
const registerUser = async (req, res) => {
  try {
    const { name, email, password, phone, useCase } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ message: 'Please provide name, email, and password' });
    }

    const userExists = await User.findOne({ email });
    if (userExists) {
      // If user exists but is not verified, we can allow re-registration or send new OTP
      if (!userExists.isVerified) {
         const otp = generateOTP();
         userExists.otp = otp;
         userExists.otpExpires = new Date(Date.now() + 10 * 60000); // 10 mins
         userExists.password = password; // update password
         userExists.name = name;
         await userExists.save();
         
         await sendOTPEmail(email, otp);
         return res.status(200).json({ message: 'User exists but unverified. New OTP sent.', requiresOtp: true, email: userExists.email });
      }
      return res.status(400).json({ message: 'User already exists with this email' });
    }

    const otp = generateOTP();
    const otpExpires = new Date(Date.now() + 10 * 60000);

    const user = await User.create({
      name,
      email,
      password,
      phone,
      useCase: useCase || 'Other',
      isVerified: false,
      otp,
      otpExpires,
    });

    if (user) {
      await sendOTPEmail(email, otp);
      res.status(201).json({
        message: 'Registration successful. OTP sent to email.',
        requiresOtp: true,
        email: user.email
      });
    } else {
      res.status(400).json({ message: 'Invalid user data' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Auth user & get token
// @route   POST /api/auth/login
// @access  Public
const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: 'Please enter email and password' });
    }

    const user = await User.findOne({ email }).select('+password');

    if (user && (await user.matchPassword(password))) {
      // Check if user is verified
      if (!user.isVerified) {
         const otp = generateOTP();
         user.otp = otp;
         user.otpExpires = new Date(Date.now() + 10 * 60000);
         await user.save();
         
         await sendOTPEmail(user.email, otp);
         return res.status(200).json({ 
           message: 'Account not verified. OTP sent to email.', 
           requiresOtp: true,
           email: user.email 
         });
      }

      res.json({
        _id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        useCase: user.useCase,
        token: generateToken(user._id),
      });
    } else {
      res.status(401).json({ message: 'Invalid email or password' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Verify OTP
// @route   POST /api/auth/verify-otp
// @access  Public
const verifyOtp = async (req, res) => {
  try {
    const { email, otp } = req.body;
    if (!email || !otp) {
      return res.status(400).json({ message: 'Please provide email and OTP' });
    }

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    if (user.isVerified) {
      return res.status(400).json({ message: 'User is already verified' });
    }

    if (user.otp !== otp) {
      return res.status(400).json({ message: 'Invalid OTP' });
    }

    if (user.otpExpires < Date.now()) {
      return res.status(400).json({ message: 'OTP has expired. Please request a new one.' });
    }

    // Mark as verified
    user.isVerified = true;
    user.otp = undefined;
    user.otpExpires = undefined;
    await user.save();

    res.json({
      _id: user._id,
      name: user.name,
      email: user.email,
      phone: user.phone,
      useCase: user.useCase,
      token: generateToken(user._id),
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Resend OTP
// @route   POST /api/auth/resend-otp
// @access  Public
const resendOtp = async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({ message: 'Please provide email' });
    }

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    if (user.isVerified) {
      return res.status(400).json({ message: 'User is already verified' });
    }

    const otp = generateOTP();
    user.otp = otp;
    user.otpExpires = new Date(Date.now() + 10 * 60000);
    await user.save();

    await sendOTPEmail(user.email, otp);
    res.json({ message: 'A new OTP has been sent to your email.' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get user profile
// @route   GET /api/auth/profile
// @access  Private
const getUserProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).populate('groups', 'name code type');
    if (user) {
      res.json({
        _id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        useCase: user.useCase,
        groups: user.groups,
        profileImage: user.profileImage,
      });
    } else {
      res.status(404).json({ message: 'User not found' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Update user profile
// @route   PUT /api/auth/profile
// @access  Private
const updateUserProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);

    if (user) {
      user.name = req.body.name || user.name;
      user.phone = req.body.phone !== undefined ? req.body.phone : user.phone;
      user.profileImage = req.body.profileImage !== undefined ? req.body.profileImage : user.profileImage;

      const updatedUser = await user.save();

      res.json({
        _id: updatedUser._id,
        name: updatedUser.name,
        email: updatedUser.email,
        phone: updatedUser.phone,
        useCase: updatedUser.useCase,
        profileImage: updatedUser.profileImage,
      });
    } else {
      res.status(404).json({ message: 'User not found' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Change password
// @route   PUT /api/auth/password
// @access  Private
const changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({ message: 'Please enter current and new password' });
    }

    const user = await User.findById(req.user._id).select('+password');

    if (user && (await user.matchPassword(currentPassword))) {
      user.password = newPassword;
      await user.save();
      res.json({ message: 'Password updated successfully' });
    } else {
      res.status(401).json({ message: 'Invalid current password' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Save/Register push token
// @route   POST /api/auth/push-token
// @access  Private
const savePushToken = async (req, res) => {
  try {
    const { pushToken } = req.body;
    if (!pushToken) {
      return res.status(400).json({ message: 'Push token required' });
    }

    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Add pushToken to array if not already present
    if (!user.pushTokens.includes(pushToken)) {
      user.pushTokens.push(pushToken);
      await user.save();
    }

    res.json({ message: 'Push token saved successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Remove/Unregister push token on logout
// @route   POST /api/auth/logout-push-token
// @access  Private
const removePushToken = async (req, res) => {
  try {
    const { pushToken } = req.body;
    if (!pushToken) {
      return res.status(400).json({ message: 'Push token required' });
    }

    const user = await User.findById(req.user._id);
    if (user) {
      user.pushTokens = user.pushTokens.filter(token => token !== pushToken);
      await user.save();
    }

    res.json({ message: 'Push token removed successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  registerUser,
  loginUser,
  verifyOtp,
  resendOtp,
  getUserProfile,
  updateUserProfile,
  changePassword,
  savePushToken,
  removePushToken,
};
