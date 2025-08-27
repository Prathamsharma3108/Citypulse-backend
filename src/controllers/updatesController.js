// src/controllers/updatesController.js
const { getNews, getWeather, getYouTubeVideos, getAds } = require('../services/apiService');
const Post = require('../models/Post');

// @route   GET /api/posts
// @desc    Get all posts
exports.getPosts = async (req, res) => {
  try {
    const posts = await Post.find({});
    res.json(posts);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @route   POST /api/posts
// @desc    Create a new post
exports.createPost = async (req, res) => {
  const { title, content, author } = req.body;
  const newPost = new Post({ title, content, author });

  try {
    const savedPost = await newPost.save();
    res.status(201).json(savedPost);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// @route   DELETE /api/posts/:id
// @desc    Delete a post by ID
exports.deletePost = async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);
    if (!post) {
      return res.status(404).json({ message: 'Post not found' });
    }
    await post.deleteOne();
    res.json({ message: 'Post removed' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @route   GET /api/city-updates/:city
// @desc    Get all city-specific updates
exports.getCityUpdates = async (req, res) => {
  const { city } = req.params;
  try {
    // Fetch data from external APIs
    const news = await getNews(city);
    const weather = await getWeather(city);
    const videos = await getYouTubeVideos(city);
    const ads = await getAds();
    const posts = await Post.find({});

    // You would integrate social media APIs here
    const socialMediaPosts = []; // Placeholder

    res.json({
      news,
      weather,
      videos,
      ads,
      posts,
      socialMediaPosts
    });
  } catch (error) {
    console.error('Error fetching city updates:', error.message);
    res.status(500).json({ message: 'Server error' });
  }
};
