const express = require('express');
const router = express.Router();
const { getRooms, getMessages, sendMessage } = require('../controllers/chat.controller');
const { protect } = require('../middleware/auth');

router.use(protect);

router.get('/rooms', getRooms);
router.get('/:roomId/messages', getMessages);
router.post('/send', sendMessage);

module.exports = router;
