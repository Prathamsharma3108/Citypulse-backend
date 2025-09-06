const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const { 
    sendFriendRequest, 
    acceptFriendRequest, 
    removeFriendOrRequest 
} = require('../controllers/friendController');

// All routes require the user to be logged in
router.use(protect);

router.post('/send/:userId', sendFriendRequest);
router.post('/accept/:userId', acceptFriendRequest);

// This single, powerful route handles three actions:
// 1. Unfriending a current friend
// 2. Cancelling a request you sent
// 3. Declining a request you received
router.delete('/remove/:userId', removeFriendOrRequest);

module.exports = router;