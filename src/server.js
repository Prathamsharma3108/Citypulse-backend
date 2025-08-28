const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const path = require('path');
const bodyParser = require('body-parser');
const session = require('express-session');
const MongoStore = require('connect-mongo');
const cron = require('node-cron');

// Local Imports
const connectDB = require('./config/db');
const Post = require('./models/Post');
const User = require('./models/User');
const { protect } = require('./middleware/authMiddleware');
const { getWeatherData, getNewsData, getYoutubeVideos } = require('./services/apiService');

// Route Imports
// const updatesRouter = require('./routes/updates'); // DELETE THIS LINE
const userRoutes = require('./routes/userRoutes');
const dashboardRoutes = require('./routes/dashboardRoutes');
const postRoutes = require('./routes/postRoutes');

// Load environment variables
dotenv.config();

// Initialize the Express application
const app = express();
const PORT = process.env.PORT || 5000;

// Connect to the database
connectDB();

// --- Middleware Setup ---
app.use(session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    store: MongoStore.create({ mongoUrl: process.env.MONGO_URI })
}));
app.use(express.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static('public'));
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// --- API Routers ---
// app.use('/api', updatesRouter); // DELETE THIS LINE
app.use('/api/users', userRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/posts', postRoutes);

// --- Page Serving Routes ---
app.get('/', (req, res) => res.render('home'));
app.get('/login', (req, res) => res.render('login'));
app.get('/register', (req, res) => res.render('register'));
app.get('/forgot-password', (req, res) => res.render('forgot-password'));
app.get('/reset-password/:resetToken', (req, res) => res.render('reset-password', { resetToken: req.params.resetToken }));
app.get('/logout', (req, res) => {
    req.session.destroy((err) => {
        if (err) return res.redirect('/dashboard');
        res.clearCookie('connect.sid');
        res.redirect('/login');
    });
});

// --- Main App Routes ---
app.get('/dashboard', protect, async (req, res) => {
    try {
        const user = req.user;
        const city = user.city;

        const weather = await getWeatherData(city);
        const news = await getNewsData('in');
        const videos = await getYoutubeVideos(city);

        const posts = await Post.find({})
            .populate('user', 'name username profilePicture')
            .populate({
                path: 'comments',
                populate: { path: 'user', select: 'username' }
            })
            .sort({ createdAt: -1 });

        const latitude = weather && weather.coord ? weather.coord.lat : null;
        const longitude = weather && weather.coord ? weather.coord.lon : null;

        res.render('dashboard', {
            user, weather, news, videos, posts, latitude, longitude
        });
    } catch (error) {
        console.error('Error loading dashboard:', error);
        res.status(500).send('Could not load dashboard.');
    }
});

app.get('/profile', protect, (req, res) => {
    res.redirect(`/profile/${req.user.username}`);
});

app.get('/profile/:username', protect, async (req, res) => {
    try {
        const profileUser = await User.findOne({ username: req.params.username });
        if (!profileUser) return res.status(404).send('User not found.');
        
        const userPosts = await Post.find({ user: profileUser._id }).sort({ createdAt: -1 });
        res.render('profile', { user: profileUser, posts: userPosts });
    } catch (error) {
        console.error(error);
        res.status(500).send('Server Error');
    }
});

// --- CRON Job ---
cron.schedule('* * * * *', async () => {
  // Cron job logic...
});

// Start the server
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});