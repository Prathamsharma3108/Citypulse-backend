const User = require('../models/User');
const Post = require('../models/Post');
const Event = require('../models/Event');

// @desc    Get data for admin dashboard
// @route   GET /api/admin/data
// @access  Private/Admin
const getAdminDashboardData = async (req, res) => {
    try {
        const users = await User.find({}).select('-password');
        const posts = await Post.find({}).populate('user', 'username');
        const events = await Event.find({}).populate('user', 'username');
        res.json({ users, posts, events });
    } catch (error) {
        res.status(500).json({ message: 'Server Error' });
    }
};

// @desc    Delete a user
// @route   DELETE /api/admin/users/:id
// @access  Private/Admin
const deleteUser = async (req, res) => {
    try {
        const user = await User.findById(req.params.id);
        if (user) {
            await user.deleteOne();
            res.json({ message: 'User removed' });
        } else {
            res.status(404).json({ message: 'User not found' });
        }
    } catch (error) {
        res.status(500).json({ message: 'Server Error' });
    }
};

module.exports = {
    getAdminDashboardData,
    deleteUser,
};