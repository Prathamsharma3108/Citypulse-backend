const mongoose = require('mongoose');

const postSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
    title: {
        type: String,
        required: false,
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
        required: false,
    },
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
    timestamps: true
});

const Post = mongoose.model('Post', postSchema);
module.exports = Post;