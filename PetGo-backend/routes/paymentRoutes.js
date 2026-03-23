const express = require('express');
const router = express.Router();
const { createVNPayPayment, vnpayReturn } = require('../controllers/payment.controller');
const { protect } = require('../middleware/auth');

router.post('/create-payment-url', protect, createVNPayPayment);
router.get('/vnpay_return', vnpayReturn);

module.exports = router;
