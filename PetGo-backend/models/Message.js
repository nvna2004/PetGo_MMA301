const mongoose = require("mongoose");

const messageSchema = new mongoose.Schema(
  {
    chatRoom: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "ChatRoom",
      required: true,
    },
    sender: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User", 
      required: true,
    },
    text: {
      type: String,
      required: true,
    },
    isRead: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

messageSchema.post("save", async function (doc, next) {
  const ChatRoom = mongoose.model("ChatRoom");
  await ChatRoom.findByIdAndUpdate(doc.chatRoom, {
    lastMessage: doc.text,
    lastMessageAt: doc.createdAt,
  });
  next();
});

module.exports = mongoose.model("Message", messageSchema);
