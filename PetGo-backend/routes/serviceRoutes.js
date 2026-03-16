const express = require('express');
const router = express.Router();
const {
  getCategories,
  getMyServices,
  getAllServices,
  createService,
  updateService,
  deleteService
} = require('../controllers/service.controller');
const { protect, authorize } = require('../middleware/auth');

router.get('/categories', getCategories);

router.use(protect);

router.get('/all', getAllServices); 
router.get('/my', authorize('shop_owner'), getMyServices);
router.post('/', authorize('shop_owner'), createService);
router.put('/:id', authorize('shop_owner'), updateService);
router.delete('/:id', authorize('shop_owner'), deleteService);

module.exports = router;
