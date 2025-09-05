const Event = require('../models/Event');

// @desc    Create a new event
// @route   POST /api/events
// @access  Private
const createEvent = async (req, res) => {
    try {
        const { title, description, lat, lng, date, organizer } = req.body;

        if (!title || !description || !lat || !lng || !date || !organizer) {
            return res.status(400).json({ message: 'Please provide all required fields.' });
        }

        const newEvent = new Event({
            title,
            description,
            location: { lat, lng },
            date,
            organizer,
            user: req.user.id 
        });

        const savedEvent = await newEvent.save();
        res.status(201).json(savedEvent);

    } catch (error) {
        console.error('Error creating event:', error.message);
        res.status(500).json({ message: 'Server error while creating event.' });
    }
};

// @desc    Get all events
// @route   GET /api/events
// @access  Public
const getEvents = async (req, res) => {
    try {
        const events = await Event.find({}).sort({ date: 1 }); // Sort by upcoming date
        res.status(200).json(events);
    } catch (error) {
        console.error('Error fetching events:', error.message);
        res.status(500).json({ message: 'Server error while fetching events.' });
    }
};

// @desc    Get a single event by ID
// @route   GET /api/events/:id
// @access  Public
const getEventById = async (req, res) => {
    try {
        const event = await Event.findById(req.params.id);
        if (!event) {
            return res.status(404).json({ message: 'Event not found.' });
        }
        res.status(200).json(event);
    } catch (error) {
        console.error('Error fetching event by ID:', error.message);
        res.status(500).json({ message: 'Server error.' });
    }
};

// @desc    Update an event
// @route   PUT /api/events/:id
// @access  Private
const updateEvent = async (req, res) => {
    try {
        let event = await Event.findById(req.params.id);
        if (!event) {
            return res.status(404).json({ message: 'Event not found.' });
        }
        // Check if the user owns the event
        if (event.user.toString() !== req.user.id) {
            return res.status(401).json({ message: 'User not authorized' });
        }

        event = await Event.findByIdAndUpdate(req.params.id, req.body, {
            new: true,
            runValidators: true,
        });

        res.status(200).json(event);
    } catch (error) {
        console.error('Error updating event:', error.message);
        res.status(500).json({ message: 'Server error.' });
    }
};

// @desc    Delete an event
// @route   DELETE /api/events/:id
// @access  Private
const deleteEvent = async (req, res) => {
    try {
        const event = await Event.findById(req.params.id);
        if (!event) {
            return res.status(404).json({ message: 'Event not found.' });
        }
        // Check if the user owns the event
        if (event.user.toString() !== req.user.id) {
            return res.status(401).json({ message: 'User not authorized' });
        }

        await event.deleteOne();
        res.status(200).json({ message: 'Event removed successfully.' });
    } catch (error) {
        console.error('Error deleting event:', error.message);
        res.status(500).json({ message: 'Server error.' });
    }
};


module.exports = {
    createEvent,
    getEvents,
    getEventById,
    updateEvent,
    deleteEvent,
};