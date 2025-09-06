const mongoose = require('mongoose');

const eventSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true,
  },
  description: {
    type: String,
    required: true,
  },
  location: {
    lat: { type: Number, required: true },
    lng: { type: Number, required: true }
  },
  date: {
    type: Date,
    required: true,
  },
  organizer: {
    type: String,
    required: true,
    trim: true,
  },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  isReported: {
    type: Boolean,
    default: false,
  },
}, { timestamps: true });

const Event = mongoose.model('Event', eventSchema);
module.exports = Event;