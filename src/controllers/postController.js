const Post = require('../models/Post');

// @desc    Create a new post
// @route   POST /api/posts
// @access  Private
const createPost = async (req, res) => {
    const { content, imageUrl } = req.body; // Can be text, image, etc.

    if (!content) {
        return res.status(400).json({ message: 'Post content cannot be empty.' });
    }

    try {
        const post = new Post({
            content,
            imageUrl,
            user: req.user.id, // Comes from the 'protect' middleware
        });

        const createdPost = await post.save();
        res.status(201).json(createdPost);

    } catch (error) {
        res.status(500).json({ message: 'Server error creating post.' });
    }
};

// @desc    Get all posts for a feed
// @route   GET /api/posts
// @access  Private
const getPosts = async (req, res) => {
    try {
        // Find posts and populate with user info (name, etc.)
        const posts = await Post.find({}).populate('user', 'name').sort({ createdAt: -1 });
        res.json(posts);
    } catch (error) {
        res.status(500).json({ message: 'Server error fetching posts.' });
    }
};

module.exports = {
    createPost,
    getPosts,
};