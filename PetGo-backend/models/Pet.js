const mongoose = require("mongoose");

const petSchema = new mongoose.Schema(
  {
    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    name: {
      type: String,
      required: [true, "Please add a pet name"],
      trim: true,
    },
    type: {
      type: String,
      required: [true, "Please specify the pet type (e.g., Dog, Cat)"],
      enum: ["Dog", "Cat", "Bird", "Other"],
    },
    breed: {
      type: String,
      trim: true,
    },
    weight: {
      type: Number,
      min: [0, "Weight cannot be negative"],
    },
    age: {
      type: Number, 
      min: [0, "Age cannot be negative"],
    },
    medicalNotes: {
      type: String,
      trim: true,
      maxLength: [500, "Medical notes cannot exceed 500 characters"],
    },
    image: {
      type: String,
      default: "no-pet-photo.jpg",
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Pet", petSchema);
