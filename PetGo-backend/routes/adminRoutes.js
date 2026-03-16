const express = require("express");
const router = express.Router();
const {
  getStats,
  getUsers,
  activateUser,
  getAllPets,
  getAllShopRequests,
  processShopRequest
} = require("../controllers/admin.controller");
const { protect, authorize } = require("../middleware/auth");

router.use(protect);
router.use(authorize("admin"));

router.get("/stats", getStats);
router.get("/users", getUsers);
router.put("/users/:id/activate", activateUser);
router.get("/pets", getAllPets);

router.get("/shop-requests", getAllShopRequests);
router.put("/shop-requests/:id", processShopRequest);

module.exports = router;
