// server.js

const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const connectDB = require('./config/db');
const updatesRouter = require('./routes/updates');
const userRoutes = require('./routes/userRoutes');
const cron = require('node-cron');
const Post = require('./models/Post');
const path = require('path');
const bodyParser = require('body-parser'); // Import body-parser

// Load environment variables
dotenv.config();

// Initialize the Express application
const app = express();
const PORT = process.env.PORT || 5000;

// Connect to the database
connectDB();

// Middleware
app.use(express.json());
// Add body-parser middleware to parse URL-encoded form data
app.use(bodyParser.urlencoded({ extended: true }));

// Configure EJS as the view engine
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Serve static files from the 'public' directory
app.use(express.static('public'));

// API routers
app.use('/api', updatesRouter);
app.use('/api/users', userRoutes);


// --- Page Serving Routes ---

// Root route to serve the EJS file
app.get('/', (req, res) => {
  const pageTitle = 'City Pulse - Your Local Hub';
  res.render('home', { pageTitle: pageTitle, user: null, posts: [] });
});

// A route to serve the login page
app.get('/login', (req, res) => {
  res.render('login');
});

// A route to serve the registration page
app.get('/register', (req, res) => {
  res.render('register');
});

// A placeholder route for the dashboard after login
app.get('/dashboard', (req, res) => {
  res.render('dashboard');
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