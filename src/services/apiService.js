const axios = require('axios');

const getWeatherData = async (city) => {
  try {
    const apiUrl = `https://api.openweathermap.org/data/2.5/weather?q=${city}&appid=${process.env.WEATHER_API_KEY}&units=metric`;
    console.log('Requesting Weather URL:', apiUrl);
    const response = await axios.get(
      `https://api.openweathermap.org/data/2.5/weather?q=${city}&appid=${process.env.WEATHER_API_KEY}&units=metric`
    );
    return response.data;
  } catch (error) {
    console.error('Error fetching weather data:', error.message);
    return { error: 'Could not fetch weather data.' };
  }
};

const getNewsData = async (countryCode = 'in') => { // Default to India
  try {
    const response = await axios.get(
      `https://newsapi.org/v2/top-headlines?country=${countryCode}&apiKey=${process.env.NEWS_API_KEY}`
    );
    return response.data.articles.slice(0, 5); // Return top 5 articles
  } catch (error) {
    console.error('Error fetching news data:', error.message);
    return { error: 'Could not fetch news data.' };
  }
};

const getYoutubeVideos = async (city) => {
    try {
        const response = await axios.get('https://www.googleapis.com/youtube/v3/search', {
            params: {
                part: 'snippet',
                q: `Top things to do in ${city}`, // Search query
                maxResults: 5,
                type: 'video',
                key: process.env.YOUTUBE_API_KEY,
            },
        });
        return response.data.items;
    } catch (error) {
        console.error('Error fetching YouTube data:', error.response.data.error);
        return { error: 'Could not fetch YouTube videos.' };
    }
};


module.exports = {
  getWeatherData,
  getNewsData,
  getYoutubeVideos,
};