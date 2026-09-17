const express = require('express');
const router = express.Router();
const {
    createEvent,
    getEvents,
    getEventById,
    updateEvent,
    deleteEvent,
} = require('../controllers/eventController');
const { protect } = require('../middleware/authMiddleware');
const upload = require('../config/cloudinary');

router.route('/')
    .get(getEvents) // Get all events
    .post(protect, upload.single('image'), createEvent); // Create a new event

router.route('/:id')
    .get(getEventById) // Get a single event
    .put(protect, updateEvent) // Update an event
    .delete(protect, deleteEvent); // Delete an event

module.exports = router;