// src/services/apiService.js
const axios = require('axios');
const dotenv = require('dotenv');

dotenv.config();

const WEATHER_API_KEY = process.env.WEATHER_API_KEY;
const NEWS_API_KEY = process.env.NEWS_API_KEY;
const YOUTUBE_API_KEY = process.env.YOUTUBE_API_KEY;
const PEXELS_API_KEY = process.env.PEXELS_API_KEY;
const BAMIFY_API_KEY = process.env.BAMIFY_API_KEY;

// Fetch weather data for a city
async function getWeather(city) {
  try {
    const response = await axios.get(
      `https://api.openweathermap.org/data/2.5/weather?q=${city}&appid=${WEATHER_API_KEY}&units=metric`
    );
    return response.data;
  } catch (error) {
    console.error('Error fetching weather data:', error.message);
    return { error: 'Failed to fetch weather data' };
  }
}

// Fetch news articles for a city
async function getNews(query) {
  try {
    const response = await axios.get(
      `https://newsapi.org/v2/everything?q=${query}&apiKey=${NEWS_API_KEY}`
    );
    return response.data.articles;
  } catch (error) {
    console.error('Error fetching news data:', error.message);
    return { error: 'Failed to fetch news data' };
  }
}

// Fetch YouTube videos
async function getYouTubeVideos(query) {
  try {
    const response = await axios.get(
      `https://www.googleapis.com/youtube/v3/search?part=snippet&q=${query}&type=video&key=${YOUTUBE_API_KEY}`
    );
    return response.data.items;
  } catch (error) {
    console.error('Error fetching YouTube videos:', error.message);
    return { error: 'Failed to fetch YouTube videos' };
  }
}

// Fetch Pexels videos
async function getPexelsVideos(query) {
  try {
    const response = await axios.get(
      `https://api.pexels.com/videos/search?query=${query}`,
      { headers: { Authorization: PEXELS_API_KEY } }
    );
    return response.data.videos;
  } catch (error) {
    console.error('Error fetching Pexels videos:', error.message);
    return { error: 'Failed to fetch Pexels videos' };
  }
}

async function getAds() {
  console.log('Fetching ads from a placeholder service...');
  return [
    {
      id: 1,
      title: 'City Eats: Discover the best restaurants in town!',
      description: 'Your guide to local dining. From fine dining to casual cafes.',
      imageUrl: 'https://via.placeholder.com/300x150.png?text=City+Eats+Ad',
      link: 'http://cityeats.com'
    },
    {
      id: 2,
      title: 'City Events: Never miss a show or festival!',
      description: 'Find concerts, festivals, and events happening this weekend.',
      imageUrl: 'https://via.placeholder.com/300x150.png?text=City+Events+Ad',
      link: 'http://cityevents.com'
    }
  ];
}

module.exports = {
  getWeather,
  getNews,
  getYouTubeVideos,
  getPexelsVideos,
  getAds,
};
