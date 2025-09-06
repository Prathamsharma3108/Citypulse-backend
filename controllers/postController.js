const Post = require('../models/Post');
const Comment = require('../models/Comment');
const User = require('../models/User');

// @desc    Create a new post
// @route   POST /api/posts
// @access  Private
const createPost = async (req, res) => {
    try {
        const { content } = req.body;
        if (!content) {
            return res.status(400).send('Post content is required.');
        }

        const post = new Post({
            content,
            user: req.user.id,
        });

        if (req.file) {
            post.imageUrl = req.file.path;
        }

        await post.save();
        res.redirect('/dashboard');
    } catch (error) {
        console.error('ERROR during post creation:', error.message);
        res.status(500).send('Server Error during post creation.');
    }
};

// @desc    Like or unlike a post
// @route   POST /api/posts/:id/like
// @access  Private
const likePost = async (req, res) => {
    try {
        const post = await Post.findById(req.params.id);
        if (!post) {
            return res.status(404).json({ message: 'Post not found' });
        }
        
        const alreadyLiked = post.likes.some(like => like.equals(req.user.id));
        let isLiked;

        if (alreadyLiked) {
            // Unlike the post
            post.likes = post.likes.filter(like => !like.equals(req.user.id));
            isLiked = false;
        } else {
            // Like the post
            post.likes.push(req.user.id);
            isLiked = true;
        }
        
        await post.save();
        
        res.json({ 
            likesCount: post.likes.length,
            isLiked: isLiked
        });

    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server Error' });
    }
};

// @desc    Add a comment to a post
// @route   POST /api/posts/:id/comment
// @access  Private
const addComment = async (req, res) => {
    try {
        const post = await Post.findById(req.params.id);
        if (!post) {
            return res.status(404).send('Post not found');
        }

        const comment = new Comment({
            content: req.body.content,
            user: req.user.id,
            post: req.params.id
        });
        await comment.save();

        post.comments.push(comment._id);
        await post.save();
        
        // Populate user details for the new comment to send back to the frontend
        const newComment = await Comment.findById(comment._id).populate('user', 'username');

        res.status(201).json(newComment); // Send new comment as JSON
    } catch (error) {
        console.error(error);
        res.status(500).send('Server Error');
    }
};

// @desc    Get all posts (for API testing)
// @route   GET /api/posts
// @access  Private
const getPosts = async (req, res) => {
    try {
        const posts = await Post.find().sort({ createdAt: -1 });
        res.json(posts);
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
};

module.exports = {
    createPost,
    likePost,
    addComment,
    getPosts
};