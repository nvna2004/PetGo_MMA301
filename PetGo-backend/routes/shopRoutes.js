const express = require('express');
const router = express.Router();
const { getShopDashboardStats, getPendingBookings, getAllShops, getShopById, getShopServices } = require('../controllers/shop.controller');
const { protect, authorize } = require('../middleware/auth');

router.get('/dashboard-stats', protect, authorize('shop_owner'), getShopDashboardStats);
router.get('/pending-bookings', protect, authorize('shop_owner'), getPendingBookings);

router.get('/all', protect, getAllShops);
router.get('/:id', protect, getShopById);
router.get('/:id/services', protect, getShopServices);

module.exports = router;
