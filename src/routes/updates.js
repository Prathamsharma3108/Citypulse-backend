const express = require('express');
const router = express.Router();
const updatesController = require('../controllers/updatesController');
const { protect } = require('../middleware/authMiddleware'); // Import the protection middleware

// Define API routes
// Route to get all city updates (weather, news, etc.)
router.get('/updates/:city', updatesController.getCityUpdates);

// Routes for Posts
// Public route to get all posts
router.get('/posts', updatesController.getPosts);
// Protected routes to create and delete posts
router.post('/posts', protect, updatesController.createPost);
router.delete('/posts/:id', protect, updatesController.deletePost);

// The Event routes are commented out because the controller functions
// are not available in the provided updatesController.js file.
// router.get('/events', updatesController.getEvents);
// router.post('/events', updatesController.createEvent);

module.exports = router;
