const express = require('express');
const router = express.Router();
const {
  createBooking,
  getMyBookings,
  getShopBookings,
  cancelBooking,
  updateBookingStatus
} = require('../controllers/booking.controller');
const { protect, authorize } = require('../middleware/auth');

router.use(protect); 

router.post('/', createBooking);
router.get('/my', getMyBookings);
router.put('/:id/cancel', cancelBooking);

router.get('/shop', authorize('shop_owner'), getShopBookings);
router.put('/shop/:id/status', authorize('shop_owner'), updateBookingStatus);

module.exports = router;
