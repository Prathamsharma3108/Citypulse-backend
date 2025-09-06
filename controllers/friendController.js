const User = require('../models/User');

exports.sendFriendRequest = async (req, res) => {
    try {
        const sender = await User.findById(req.user.id);
        const receiver = await User.findById(req.params.userId);

        // Safety Check 1: Make sure both users actually exist
        if (!sender || !receiver) {
            return res.status(404).json({ message: 'User not found' });
        }
        
        // Safety Check 2: Prevent users from adding themselves
        if (sender.id === receiver.id) {
            return res.status(400).json({ message: 'You cannot add yourself as a friend.' });
        }

        // Safety Check 3: Use || [] to prevent crashes if 'friends' array is missing
        if ((sender.friends || []).includes(receiver.id)) {
            return res.status(400).json({ message: 'You are already friends.' });
        }
         if ((sender.friendRequestsSent || []).includes(receiver.id)) {
            return res.status(400).json({ message: 'You have already sent a request.' });
        }

        // --- Database Logic ---
        await User.findByIdAndUpdate(sender._id, { $addToSet: { friendRequestsSent: receiver._id } });
        await User.findByIdAndUpdate(receiver._id, { $addToSet: { friendRequestsReceived: sender._id } });
        
        res.status(200).json({ message: 'Friend request sent' });

    } catch (error) {
        // Improved error logging
        console.error('CRITICAL ERROR in sendFriendRequest:', error);
        res.status(500).json({ message: 'Server Error' });
    }
};

exports.acceptFriendRequest = async (req, res) => {
    try {
        const currentUser = await User.findById(req.user.id);
        const requestingUser = await User.findById(req.params.userId);
        if (!requestingUser) { return res.status(404).json({ message: 'User not found' }); }
        
        await User.findByIdAndUpdate(currentUser._id, { $addToSet: { friends: requestingUser._id }, $pull: { friendRequestsReceived: requestingUser._id } });
        await User.findByIdAndUpdate(requestingUser._id, { $addToSet: { friends: currentUser._id }, $pull: { friendRequestsSent: currentUser._id } });
        
        res.status(200).json({ message: 'Friend request accepted' });
    } catch (error) {
        console.error('Error accepting friend request:', error);
        res.status(500).json({ message: 'Server Error' });
    }
};

exports.removeFriendOrRequest = async (req, res) => {
    try {
        const currentUser = await User.findById(req.user.id);
        const otherUser = await User.findById(req.params.userId);
        if (!otherUser) { return res.status(404).json({ message: 'User not found' }); }
        
        await User.findByIdAndUpdate(currentUser._id, { $pull: { friends: otherUser._id, friendRequestsSent: otherUser._id, friendRequestsReceived: otherUser._id } });
        await User.findByIdAndUpdate(otherUser._id, { $pull: { friends: currentUser._id, friendRequestsSent: currentUser._id, friendRequestsReceived: currentUser._id } });
        
        res.status(200).json({ message: 'Action completed' });
    } catch (error) {
        console.error('Error removing friend or request:', error);
        res.status(500).json({ message: 'Server Error' });
    }
};