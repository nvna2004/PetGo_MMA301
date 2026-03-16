const express = require("express");
const router = express.Router();
const {
  createPet,
  getPets,
  getPet,
  updatePet,
  deletePet,
} = require("../controllers/pet.controller");
const { protect } = require("../middleware/auth");

const upload = require("../middleware/upload");

router.use(protect);

router.route("/")
  .post(upload.single('image'), createPet)
  .get(getPets);

router.route("/:id")
  .get(getPet)
  .put(upload.single('image'), updatePet)
  .delete(deletePet);

module.exports = router;
