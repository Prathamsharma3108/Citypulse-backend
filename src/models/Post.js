const mongoose = require('mongoose');

const postSchema = new mongoose.Schema({
    // Changed 'author' to a direct reference to the User model
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
    title: {
        type: String,
        required: false, // Title can be optional
    },
    content: {
        type: String,
        required: true,
    },
    content: {
        type: String,
        required: true,
    },
    imageUrl: {
        type: String,
    },
    city: {
        type: String,
        required: false, // City can be optional or derived
    },
    // Added the 'likes' array to track who has liked the post
    likes: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    }],
    comments: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Comment'
    }],
    
    isPublished: {
        type: Boolean,
        default: true,
    },
    scheduledFor: {
        type: Date,
    },
    publishedAt: {
        type: Date,
    }
}, {
    timestamps: true // Automatically adds createdAt and updatedAt
});

const Post = mongoose.model('Post', postSchema);
module.exports = Post;