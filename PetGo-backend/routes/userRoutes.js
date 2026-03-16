const express = require('express');
const router = express.Router();
const { 
  loginUser, 
  registerUser, 
  verifyOTP, 
  forgotPassword, 
  resetPassword,
  getMe,
  updatePassword,
  logoutUser,
  updateProfile,
  createShopRequest,
  getMyShopRequest,
  updateShopInfo
} = require('../controllers/user.controller');

const { protect } = require('../middleware/auth');

router.post('/register', registerUser);
router.post('/verify-otp', verifyOTP);
router.post('/login', loginUser);
router.post('/logout', logoutUser);
router.post('/forgot-password', forgotPassword);
router.post('/reset-password', resetPassword);
router.get('/me', protect, getMe);
router.put('/update-password', protect, updatePassword);
router.put('/update-profile', protect, updateProfile);

router.post('/shop-request', protect, createShopRequest);
router.get('/shop-request/me', protect, getMyShopRequest);

router.put('/update-shop-info', protect, updateShopInfo);

module.exports = router;
