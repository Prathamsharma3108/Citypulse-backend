const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const User = require('../models/User');
const Conversation = require('../models/Conversation');
const Message = require('../models/Message');

router.use(protect);

router.get('/friends', async (req, res) => {
    try {
        const user = await User.findById(req.user.id).populate('friends', 'username name profilePicture city');
        res.json(user.friends || []);
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
});

router.get('/conversations', async (req, res) => {
    try {
        const conversations = await Conversation.find({ participants: req.user.id })
            .populate('participants', 'username name profilePicture')
            .populate('messages')
            .sort({ updatedAt: -1 });
        res.json(conversations);
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
});

router.get('/messages/:otherUserId', async (req, res) => {
    try {
        const conversation = await Conversation.findOne({
            participants: { $all: [req.user.id, req.params.otherUserId] }
        }).populate('messages');

        if (!conversation) {
            return res.json([]);
        }

        const messages = conversation.messages.filter(
            m => m.sender.toString() === req.user.id || m.receiver.toString() === req.user.id
        );

        res.json(messages);
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
});

module.exports = router;