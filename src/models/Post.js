// src/models/Post.js
const mongoose = require('mongoose');

const postSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
  },
  content: {
    type: String,
    required: true,
  },
  author: {
    type: String,
    required: true,
  },
  city: {
    type: String,
    required: true,
  },
  publishedAt: {
    type: Date,
  },
  scheduledFor: {
    type: Date,
    default: null,
  },
  isPublished: {
    type: Boolean,
    default: false, // Default should be false for scheduled posts
  },
}, { timestamps: true });

// Pre-save hook to set isPublished based on scheduledFor
postSchema.pre('save', function(next) {
  if (!this.scheduledFor) {
    this.isPublished = true;
    this.publishedAt = Date.now();
  }
  next();
});

const Post = mongoose.model('Post', postSchema);
module.exports = Post;
