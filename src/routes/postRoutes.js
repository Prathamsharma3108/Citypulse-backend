const express = require('express');
const router = express.Router();
const { createPost, getPosts } = require('../controllers/postController');
const { protect } = require('../middleware/authMiddleware');

// Attach the 'protect' middleware to all routes in this file
router.route('/').post(protect, createPost).get(protect, getPosts);

module.exports = router;