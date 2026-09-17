const User = require('../models/User');
const crypto = require('crypto');
const sendEmail = require('../utils/sendEmail');

const registerUser = async (req, res) => {
    const { username, name, email, password, city } = req.body;
    try {
        const emailExists = await User.findOne({ email });
        if (emailExists) {
            return res.status(400).send('A user with that email already exists.');
        }
        const usernameExists = await User.findOne({ username });
        if (usernameExists) {
            return res.status(400).send('That username is already taken.');
        }
        const user = new User({ username, name, email, password, city });
        await user.save();
        res.redirect('/login');
    } catch (error) {
        console.error(error);
        res.status(500).send('Server error during registration.');
    }
};

const loginUser = async (req, res) => {
    const { email, password } = req.body;
    try {
        const user = await User.findOne({ email });
        if (user && (await user.matchPassword(password))) {
            req.session.userId = user._id;
            res.redirect('/dashboard');
        } else {
            res.render('login', { error: 'Invalid email or password' });
        }
    } catch (error) {
        console.error(error);
        res.status(500).send('Server error during login.');
    }
};

const updateProfile = async (req, res) => {
    try {
        const user = await User.findById(req.user.id);
        if (user) {
            user.name = req.body.name || user.name;
            user.bio = req.body.bio || user.bio;
            user.city = req.body.city || user.city;
            
            if (req.file) {
                user.profilePicture = req.file.path;
            }
            
            await user.save();
            
            // Return JSON for the frontend
            res.json({
                message: 'Profile updated successfully',
                user: {
                    id: user._id,
                    username: user.username,
                    name: user.name,
                    email: user.email,
                    city: user.city,
                    bio: user.bio,
                    profilePicture: user.profilePicture
                }
            });
        } else {
            res.status(404).json({ message: 'User not found' });
        }
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server Error' });
    }
};

const forgotPassword = async (req, res) => {
    try {
        const user = await User.findOne({ email: req.body.email });
        if (!user) {
            return res.render('forgot-password', { message: 'No user found with that email.' });
        }
        const resetToken = user.getResetPasswordToken();
        await user.save({ validateBeforeSave: false });
        const resetUrl = `${req.protocol}://${req.get('host')}/reset-password/${resetToken}`;
        const message = `You are receiving this email because you requested a password reset. Please follow this link to reset your password: \n\n ${resetUrl}`;
        await sendEmail({
            email: user.email,
            subject: 'Password Reset Instructions',
            message
        });
        res.render('forgot-password', { message: 'An email has been sent with instructions.' });
    } catch (error) {
        console.error(error);
        res.status(500).send('Email could not be sent.');
    }
};

const resetPassword = async (req, res) => {
    try {
        const resetPasswordToken = crypto.createHash('sha256').update(req.params.resetToken).digest('hex');
        const user = await User.findOne({
            resetPasswordToken,
            resetPasswordExpire: { $gt: Date.now() }
        });
        if (!user) {
            return res.status(400).send('Invalid or expired token.');
        }
        if (req.body.password !== req.body.confirmPassword) {
            return res.status(400).send('Passwords do not match.');
        }
        user.password = req.body.password;
        user.resetPasswordToken = undefined;
        user.resetPasswordExpire = undefined;
        await user.save();
        res.redirect('/login');
    } catch (error) {
        console.error(error);
        res.status(500).send('Server error.');
    }
};

const getUserProfile = async (req, res) => {
    try {
        const user = await User.findOne({ username: req.params.username })
            .select('-password')
            .populate('friends', 'username profilePicture')
            .populate('friendRequestsReceived', 'username profilePicture');
        
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        res.json(user);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server Error' });
    }
};

const getMe = async (req, res) => {
    try {
        const user = await User.findById(req.user.id)
            .select('-password')
            .populate('friends', 'username profilePicture')
            .populate('friendRequestsReceived', 'username profilePicture');
        res.json(user);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server Error' });
    }
};

module.exports = { 
    registerUser, 
    loginUser, 
    updateProfile, 
    forgotPassword, 
    resetPassword,
    getUserProfile,
    getMe
};