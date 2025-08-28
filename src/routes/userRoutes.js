const express = require('express');
const router = express.Router();
const { 
    registerUser, 
    loginUser, 
    forgotPassword, 
    resetPassword, 
    updateProfile 
} = require('../controllers/userController');
const { protect } = require('../middleware/authMiddleware');
const upload = require('../config/cloudinary');

// --- Authentication Routes ---
router.post('/register', registerUser);
router.post('/login', loginUser);

// --- Profile Routes ---
// The upload.single() middleware handles the file upload before updateProfile is called
router.post('/profile', protect, upload.single('profilePicture'), updateProfile);

// --- Password Reset Routes ---
router.post('/forgot-password', forgotPassword);
router.post('/reset-password/:resetToken', resetPassword);

module.exports = router;