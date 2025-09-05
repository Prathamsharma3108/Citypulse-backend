const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const path = require('path');
const bodyParser = require('body-parser');
const session = require('express-session');
const MongoStore = require('connect-mongo');
const cron = require('node-cron');

const connectDB = require('./config/db');
const Post = require('./models/Post');
const User = require('./models/User');
const { protect } = require('./middleware/authMiddleware');
const { admin } = require('./middleware/adminMiddleware');
const { getWeatherData, getNewsData, getYoutubeVideos } = require('./services/apiService');

const userRoutes = require('./routes/userRoutes');
const postRoutes = require('./routes/postRoutes');
const eventRoutes = require('./routes/eventRoutes');
const adminRoutes = require('./routes/adminRoutes');

dotenv.config();
const app = express();
const PORT = process.env.PORT || 5000;
connectDB();

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

app.use(async (req, res, next) => {
    if (req.session.userId) {
        res.locals.currentUser = await User.findById(req.session.userId).select('-password');
    } else {
        res.locals.currentUser = null;
    }
    next();
});

app.use('/api/users', userRoutes);
app.use('/api/posts', postRoutes);
app.use('/api/events', eventRoutes);
app.use('/api/admin', adminRoutes);

app.get('/', (req, res) => res.render('home'));
app.get('/login', (req, res) => res.render('login', { error: '' }));
app.get('/register', (req, res) => res.render('register'));
app.get('/logout', (req, res) => {
    req.session.destroy(err => {
        if (err) return res.redirect('/dashboard');
        res.clearCookie('connect.sid');
        res.redirect('/login');
    });
});
app.get('/edit-profile', protect, (req, res) => res.render('edit-profile'));

app.get('/dashboard', protect, async (req, res) => {
    try {
        const user = req.user;
        const city = user.city || 'Panipat';
        const weather = await getWeatherData(city);
        const news = await getNewsData();
        const videos = await getYoutubeVideos(city);
        const posts = await Post.find({}).populate('user', 'name username profilePicture').populate({ path: 'comments', populate: { path: 'user', select: 'username' }}).sort({ createdAt: -1 });
        const latitude = weather && weather.coord ? weather.coord.lat : null;
        const longitude = weather && weather.coord ? weather.coord.lon : null;
        res.render('dashboard', { user, weather, news, videos, posts, latitude, longitude });
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
        // --- FIXED: Using a case-insensitive regular expression for the search ---
        const profileUser = await User.findOne({ 
            username: new RegExp('^' + req.params.username + '$', 'i') 
        });

        if (!profileUser) {
            return res.status(404).send('User not found.');
        }
        
        const userPosts = await Post.find({ user: profileUser._id }).populate({ path: 'comments', populate: { path: 'user', select: 'username' }}).sort({ createdAt: -1 });
        res.render('profile', { profileUser, posts: userPosts });
    } catch (error) {
        console.error('Error loading profile page:', error);
        res.status(500).send('Server Error');
    }
});

app.get('/admin', protect, admin, async (req, res) => {
    try {
        const users = await User.find({}).select('-password');
        const posts = await Post.find({}).populate('user', 'username');
        res.render('admin', { users, posts, currentUser: req.user });
    } catch (error) {
        res.status(500).send('Server Error');
    }
});

cron.schedule('* * * * *', async () => {});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});