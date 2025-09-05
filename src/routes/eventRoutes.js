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

router.route('/')
    .get(getEvents) // Get all events
    .post(protect, createEvent); // Create a new event

router.route('/:id')
    .get(getEventById) // Get a single event
    .put(protect, updateEvent) // Update an event
    .delete(protect, deleteEvent); // Delete an event

module.exports = router;