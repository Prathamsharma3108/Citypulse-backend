const express = require('express');
const router = express.Router();
const { 
    createPost, 
    getPosts, 
    likePost, 
    addComment 
} = require('../controllers/postController');
const { protect } = require('../middleware/authMiddleware');
// 1. Import the upload middleware
const upload = require('../config/cloudinary');

// 2. Add the middleware to the post creation route
router.route('/').post(protect, upload.single('postImage'), createPost).get(protect, getPosts);

router.post('/:id/like', protect, likePost);
router.post('/:id/comment', protect, addComment);

module.exports = router;