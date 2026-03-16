const mongoose = require("mongoose");

const chatRoomSchema = new mongoose.Schema(
  {
    customer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    shop: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    lastMessage: {
      type: String,
      default: "", 
    },
    lastMessageAt: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: true }
);

chatRoomSchema.index({ customer: 1, shop: 1 }, { unique: true });

module.exports = mongoose.model("ChatRoom", chatRoomSchema);
