const mongoose = require("mongoose");

const reviewSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    service: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "PetService",
      required: true,
    },
    shopOwner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    booking: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Booking",
      required: true,
    },
    rating: {
      type: Number,
      required: [true, "Please add a rating between 1 and 5"],
      min: 1,
      max: 5,
    },
    comment: {
      type: String,
      required: [true, "Please add a comment"],
      trim: true,
      maxLength: [1000, "Comment cannot exceed 1000 characters"],
    },
  },
  { timestamps: true }
);

reviewSchema.index({ booking: 1, user: 1 }, { unique: true });

module.exports = mongoose.model("Review", reviewSchema);
