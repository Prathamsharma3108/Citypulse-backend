const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const connectDB = require('./config/db');
const updatesRouter = require('./routes/updates');
const userRoutes = require('./routes/userRoutes');
const cron = require('node-cron');
const Post = require('./models/Post');
const path = require('path');
const bodyParser = require('body-parser');
const dashboardRoutes = require('./routes/dashboardRoutes'); 
const postRoutes = require('./routes/postRoutes');

// --- FIX #1: Import Session Packages ---
const session = require('express-session');
const MongoStore = require('connect-mongo');
const { protect } = require('./middleware/authMiddleware');
const { getWeatherData, getNewsData, getYoutubeVideos } = require('./services/apiService');


// Load environment variables
dotenv.config();

// Initialize the Express application
const app = express();
const PORT = process.env.PORT || 5000;

// Connect to the database
connectDB();


// --- FIX #1: Add Session Middleware ---
// This MUST come before your routes
app.use(session({
    secret: process.env.SESSION_SECRET, // Make sure to add SESSION_SECRET to your .env file
    resave: false,
    saveUninitialized: false,
    store: MongoStore.create({ mongoUrl: process.env.MONGO_URI })
}));


// Other Middleware
app.use(express.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Configure EJS as the view engine
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Serve static files from the 'public' directory
app.use(express.static('public'));

// --- API Routers ---
app.use('/api', updatesRouter);
app.use('/api/users', userRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/posts', postRoutes);


// --- Page Serving Routes ---

app.get('/', (req, res) => {
  res.render('home');
});

app.get('/login', (req, res) => {
  res.render('login');
});

app.get('/register', (req, res) => {
  res.render('register');
});


// --- FIX #2: Replace the old dashboard route with this new one ---
app.get('/dashboard', protect, async (req, res) => {
  try {
    const user = req.user;
    const city = user.city || 'Delhi';

    const weather = await getWeatherData(city);
    const news = await getNewsData('in');
    const videos = await getYoutubeVideos(city);

    res.render('dashboard', {
      user: user,
      weather: weather,
      news: news,
      videos: videos
    });

  } catch (error) {
    console.error('Error loading dashboard:', error);
    res.status(500).send('Could not load dashboard.');
  }
});


// --- CRON Job ---
cron.schedule('* * * * *', async () => {
  const now = new Date();
  try {
    const scheduledPosts = await Post.find({
      isPublished: false,
      scheduledFor: { $lte: now }
    });
    if (scheduledPosts.length > 0) {
      console.log(`Publishing ${scheduledPosts.length} scheduled posts.`);
      for (const post of scheduledPosts) {
        await Post.findByIdAndUpdate(post._id, { isPublished: true, publishedAt: now });
      }
    }
  } catch (err) {
    console.error('Error during scheduled post check:', err);
  }
});

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});