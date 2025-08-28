const Post = require('../models/Post');
const Comment = require('../models/Comment');

// Replace ONLY the createPost function in controllers/postController.js

const createPost = async (req, res) => {
    // --- ADD THESE LOGS FOR DEBUGGING ---
    console.log('--- Inside createPost Function ---');
    console.log('USER DATA (req.user):', req.user);
    console.log('FORM TEXT DATA (req.body):', req.body);
    console.log('UPLOADED FILE DATA (req.file):', req.file);
    console.log('--------------------------------');

    try {
        const { content } = req.body;
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
// Replace the existing likePost function

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
        
        // Send back a JSON response with the new data
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
        res.redirect('/dashboard');
    } catch (error) {
        console.error(error);
        res.status(500).send('Server Error');
    }
};

// @desc    Get all posts (for API testing)
const getPosts = async (req, res) => {
    try {
        const posts = await Post.find().sort({ createdAt: -1 });
        res.json(posts);
    } catch (error) {
        console.error(error);
        res.status(500).send('Server Error');
    }
};

module.exports = {
    createPost,
    getPosts,
    likePost,
    addComment
};