const express = require('express');
const router = express.Router();
const { getWeatherData, getNewsData, getYoutubeVideos } = require('../services/apiService');
const { protect } = require('../middleware/authMiddleware');

// @desc    Get all data for the main dashboard
// @route   GET /api/dashboard
// @access  Private
router.get('/', protect, async (req, res) => {
    // Assuming the user's city is stored in their profile
    // For now, let's use a default city like "Mumbai"
    const city = req.user.city || 'Mumbai'; 

    try {
        const weather = await getWeatherData(city);
        const news = await getNewsData();
        const videos = await getYoutubeVideos(city);

        res.json({
            weather,
            news,
            videos,
        });

    } catch (error) {
        res.status(500).json({ message: 'Server error while fetching dashboard data.' });
    }
});

module.exports = router;