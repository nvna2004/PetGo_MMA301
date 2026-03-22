const ChatRoom = require('../models/ChatRoom');
const Message = require('../models/Message');

const getRooms = async (req, res) => {
  try {
    const userId = req.user._id;
    const role = req.user.role;

    const query = role === 'shop_owner' ? { shop: userId } : { customer: userId };

    const rooms = await ChatRoom.find(query)
      .populate('customer', 'name role avatar')
      .populate('shop', 'name address role avatar')
      .sort({ lastMessageAt: -1 })
      .lean();

    res.status(200).json({ success: true, data: rooms });
  } catch (error) {
    console.error('getRooms Error:', error);
    res.status(500).json({ success: false, message: 'Lỗi máy chủ' });
  }
};

const getMessages = async (req, res) => {
  try {
    const { roomId } = req.params;

    let room = await ChatRoom.findById(roomId);

    if (!room) {
      const customer = req.user.role === 'customer' ? req.user._id : roomId;
      const shop = req.user.role === 'shop_owner' ? req.user._id : roomId;
      room = await ChatRoom.findOne({ customer, shop });
    }

    if (!room) {
      return res.status(404).json({ success: false, message: 'Phòng chat không tồn tại' });
    }
    
    await Message.updateMany(
      { chatRoom: room._id, sender: { $ne: req.user._id }, isRead: false },
      { $set: { isRead: true } }
    );

    const messages = await Message.find({ chatRoom: room._id })
      .populate('sender', 'name')
      .sort({ createdAt: 1 })
      .lean();

    res.status(200).json({ success: true, data: messages, roomId: room._id });
  } catch (error) {
    console.error('getMessages Error:', error);
    res.status(500).json({ success: false, message: 'Lỗi máy chủ' });
  }
};

const sendMessage = async (req, res) => {
  try {
    const { receiverId, roomId, text } = req.body;
    const senderId = req.user._id;
    const role = req.user.role;

    let room;
    if (roomId) {
      room = await ChatRoom.findById(roomId);
      if (!room) {
        const potentialReceiverId = roomId;
        const customer = role === 'customer' ? senderId : potentialReceiverId;
        const shop = role === 'shop_owner' ? senderId : potentialReceiverId;
        room = await ChatRoom.findOne({ customer, shop });
      }
    } else if (receiverId) {
      const customer = role === 'customer' ? senderId : receiverId;
      const shop = role === 'shop_owner' ? senderId : receiverId;
      room = await ChatRoom.findOne({ customer, shop });
      if (!room) {
        room = await ChatRoom.create({ customer, shop });
      }
    }

    if (!room) {
      return res.status(400).json({ success: false, message: 'Thiếu thông tin phòng chat' });
    }

    const message = await Message.create({
      chatRoom: room._id,
      sender: senderId,
      text,
      isRead: false
    });

    const populatedMessage = await message.populate('sender', 'name');

    const io = req.app.get('io');
    if (io) {
      io.to(room._id.toString()).emit('newMessage', populatedMessage);
    }

    res.status(201).json({ success: true, data: populatedMessage, roomId: room._id });
  } catch (error) {
    console.error('sendMessage Error:', error);
    res.status(500).json({ success: false, message: 'Lỗi máy chủ' });
  }
};

module.exports = { getRooms, getMessages, sendMessage };
