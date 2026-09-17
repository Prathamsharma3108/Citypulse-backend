const express = require('express');
const cors = require('cors');
const path = require('path');
const dotenv = require('dotenv');
const session = require('express-session');
const MongoStore = require('connect-mongo');
const http = require('http');
const { Server } = require("socket.io");

// All local imports now use ./
const connectDB = require('./config/db');
const { protect } = require('./middleware/authMiddleware');
const { admin } = require('./middleware/adminMiddleware');
const userRoutes = require('./routes/userRoutes');
const postRoutes = require('./routes/postRoutes');
const eventRoutes = require('./routes/eventRoutes');
const adminRoutes = require('./routes/adminRoutes');
const friendRoutes = require('./routes/friendRoutes');

// --- Import ALL Auth Controller functions ---
// This controller will now handle the full auth flow, including OTP
const { 
    renderLoginPage, 
    renderRegisterPage, 
    registerUser, 
    loginUser, 
    forgotPassword, 
    resetPassword,
    renderOtpPage,
    verifyOtp
} = require('./controllers/authController'); // Ensure this path is correct

const User = require('./models/User');
const Post = require('./models/Post');
const Conversation = require('./models/Conversation');
const Message = require('./models/Message');
const { getWeatherData, getNewsData, getYoutubeVideos } = require('./services/apiService');

// Initial setup
dotenv.config();
const app = express();
const server = http.createServer(app);

// Trust reverse proxy (crucial for Render and HTTPS session cookies)
app.set('trust proxy', 1);

const allowedOrigins = [
    "http://localhost:5173",
    "http://localhost:5174",
    "http://localhost:5175",
    "http://localhost:5176",
    "http://localhost:5177",
    "http://localhost:3000",
    "https://citypulse-backend-9ezi.onrender.com",
    ...(process.env.CLIENT_URL ? [process.env.CLIENT_URL] : [])
];

const corsOriginCheck = (origin, callback) => {
    // Allow requests with no origin (like mobile apps, curl, server-to-server)
    if (!origin) return callback(null, true);
    if (allowedOrigins.includes(origin) || origin.endsWith('.vercel.app')) {
        return callback(null, true);
    }
    return callback(new Error('Not allowed by CORS'));
};

const io = new Server(server, {
    cors: {
        origin: corsOriginCheck,
        methods: ["GET", "POST"],
        credentials: true
    }
});
const PORT = process.env.PORT || 5000;

connectDB();

// Request logger
app.use((req, res, next) => {
    console.log(`${req.method} ${req.url}`);
    next();
});

// Middleware
app.use(cors({
    origin: corsOriginCheck,
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"]
}));
app.use(session({
    secret: process.env.SESSION_SECRET || 'citypulse_default_secret',
    resave: false,
    saveUninitialized: false,
    store: MongoStore.create({ mongoUrl: process.env.MONGO_URI }),
    proxy: true,
    cookie: {
        secure: process.env.NODE_ENV === 'production',
        sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
        maxAge: 1000 * 60 * 60 * 24 * 7 // 7 days
    }
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Static and Views folders are now relative to the project root
app.use(express.static(path.join(__dirname, 'public')));
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Serve React App in production
app.use(express.static(path.join(__dirname, 'my-modern-app/dist')));

// Global middleware to set currentUser in all views
app.use(async (req, res, next) => {
    if (req.session.userId) {
        res.locals.currentUser = await User.findById(req.session.userId).select('-password');
    } else {
        res.locals.currentUser = null;
    }
    next();
});

// Health Check Endpoint (useful for Render deployment monitoring)
app.get('/api/health', (req, res) => {
    res.status(200).json({ status: 'ok', uptime: process.uptime() });
});

// API Routers
app.use('/api/users', userRoutes);
app.use('/api/posts', postRoutes);
app.use('/api/events', eventRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/friends', friendRoutes);
app.use('/api/chat', require('./routes/chatRoutes'));
app.use('/api', require('./routes/updates'));

// --- Authentication Routes ---
// Page Renders (EJS)
app.get('/auth/login', renderLoginPage);
app.get('/auth/register', renderRegisterPage);
app.get('/auth/verify-otp', renderOtpPage);
app.get('/auth/forgot-password', (req, res) => res.render('forgot-password'));
app.get('/auth/reset-password/:resetToken', (req, res) => res.render('reset-password', { resetToken: req.params.resetToken }));

// Form / API Handlers
app.post('/auth/register', registerUser);
app.post('/auth/login', loginUser);
app.post('/auth/verify-otp', verifyOtp);
app.post('/auth/forgot-password', forgotPassword);
app.post('/auth/reset-password/:resetToken', resetPassword);

app.get('/auth/me', protect, async (req, res) => {
    res.json(res.locals.currentUser);
});

app.get('/logout', (req, res) => {
    req.session.destroy(err => {
        res.clearCookie('connect.sid');
        if (req.headers.accept && req.headers.accept.includes('application/json')) {
            return res.json({ message: 'Logged out successfully' });
        }
        res.redirect('/auth/login');
    });
});

// --- Page Rendering Routes ---
app.get('/', (req, res) => res.render('home'));

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
        const profileUser = await User.findOne({ username: new RegExp('^' + req.params.username + '$', 'i') });
        if (!profileUser) return res.status(404).send('User not found.');
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

app.get('/chat', protect, async (req, res) => {
    try {
        const user = await User.findById(req.user.id).populate('friends', 'username profilePicture');
        res.render('chat', { friends: user.friends });
    } catch (error) {
        console.error('Error loading chat page:', error);
        res.status(500).send('Server Error');
    }
});

// Fallback for SPA or generic requests (serves React app if built, otherwise API message)
app.get('*', (req, res) => {
    if (req.url.startsWith('/api') || req.url.startsWith('/auth')) {
        return res.status(404).json({ message: 'API route not found' });
    }
    const indexPath = path.join(__dirname, 'my-modern-app/dist/index.html');
    res.sendFile(indexPath, (err) => {
        if (err) {
            res.status(200).send('CityPulse Backend API is live');
        }
    });
});

// Socket.IO Real-Time Chat Logic
const onlineUsers = new Map();

io.on('connection', (socket) => {
  console.log('✅ A user connected:', socket.id);

  socket.on('join', (userId) => {
    onlineUsers.set(userId, socket.id);
    console.log(`User ${userId} joined chat.`);
  });

  socket.on('sendMessage', async ({ senderId, receiverId, content }) => {
    try {
      let conversation = await Conversation.findOne({ participants: { $all: [senderId, receiverId] } });
      if (!conversation) {
        conversation = await Conversation.create({ participants: [senderId, receiverId] });
      }
      const newMessage = new Message({
        conversationId: conversation._id,
        sender: senderId,
        receiver: receiverId,
        content: content,
      });
      await newMessage.save();
      conversation.messages.push(newMessage._id);
      await conversation.save();
      const receiverSocketId = onlineUsers.get(receiverId);
      if (receiverSocketId) {
        io.to(receiverSocketId).emit('newMessage', newMessage);
      }
    } catch (error) {
      console.error('Error handling message:', error);
    }
  });

  socket.on('disconnect', () => {
    for (let [userId, socketId] of onlineUsers.entries()) {
      if (socketId === socket.id) {
        onlineUsers.delete(userId);
        console.log(`❌ User ${userId} disconnected.`);
        break;
      }
    }
  });
});

// Start Server
server.listen(PORT, () => {
  console.log(`🚀 Server is running on port ${PORT}`);
});