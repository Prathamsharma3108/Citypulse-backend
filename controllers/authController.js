const User = require('../models/User');
const crypto = require('crypto');
const sendEmail = require('../utils/sendEmail'); // (Ensure this path is correct)

// --- Functions to RENDER pages ---
const renderLoginPage = (req, res) => {
    console.log('[AUTH] Rendering login page');
    res.render('login', { pageTitle: 'Login', error: null });
};

const renderRegisterPage = (req, res) => {
    console.log('[AUTH] Rendering register page');
    res.render('register', { pageTitle: 'Register' });
};

// --- Functions to HANDLE form submissions ---

// @desc    Register a new user
// @route   POST /auth/register
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
        // The .pre('save') hook in your User model will automatically hash the password
        await user.save();
        // Log the user in immediately by creating a session
        req.session.userId = user._id;
        res.redirect('/dashboard');
    } catch (error) {
        console.error(error);
        res.status(500).send('Server error during registration.');
    }
};

// @desc    Login user & send OTP
// @route   POST /auth/login
const loginUser = async (req, res) => {
    const { email, password } = req.body;
    console.log(`[AUTH] Login attempt for email: ${email}`);
    try {
        const user = await User.findOne({ email });

        if (!user) {
            console.log(`[AUTH] User NOT found for email: ${email}`);
            return res.render('login', { pageTitle: 'Login', error: 'Invalid email or password' });
        }

        console.log(`[AUTH] User found: ${user.username} (${user._id})`);

        // Check password
        const isMatch = await user.matchPassword(password);
        console.log(`[AUTH] Password match for ${email}: ${isMatch}`);

        if (isMatch) {
            // --- Password is correct, now send OTP ---
            const otp = Math.floor(100000 + Math.random() * 900000).toString();
            const otpExpire = Date.now() + 10 * 60 * 1000; 

            user.otp = otp;
            user.otpExpire = otpExpire;
            await user.save();
            console.log(`[AUTH] OTP generated for ${email}: ${otp}`);

            try {
                console.log(`[AUTH] Attempting to send OTP email to ${user.email}`);
                await sendEmail({
                    email: user.email,
                    subject: 'Your City Pulse Login OTP',
                    message: `Your One-Time Password (OTP) for login is: ${otp}\n\nIt is valid for 10 minutes.`
                });
                console.log(`[AUTH] OTP email sent successfully to ${user.email}`);

                req.session.otpEmail = user.email; 
                console.log(`[AUTH] Session otpEmail set to: ${req.session.otpEmail}`);
                
                // IMPORTANT: Ensure session is saved before redirecting
                req.session.save((err) => {
                    if (err) {
                        console.error('[AUTH] Session save error:', err);
                        return res.render('login', { pageTitle: 'Login', error: 'Session error. Please try again.' });
                    }
                    console.log(`[AUTH] Redirecting to /auth/verify-otp`);
                    res.redirect('/auth/verify-otp');
                });

            } catch (emailError) {
                console.error('[AUTH] Email sending error:', emailError);
                res.render('login', { pageTitle: 'Login', error: 'Could not send OTP. Please try again.' });
            }

        } else {
            console.log(`[AUTH] Password mismatch for ${email}`);
            res.render('login', { pageTitle: 'Login', error: 'Invalid email or password' });
        }
    } catch (error) {
        console.error('[AUTH] Login Error:', error);
        res.status(500).send('Server error during login.');
    }
};

// @desc    Forgot password
// @route   POST /auth/forgot-password
const forgotPassword = async (req, res) => {
    const { email } = req.body;
    try {
        const user = await User.findOne({ email });
        if (!user) {
            return res.status(404).send('User not found.');
        }
        const resetToken = crypto.randomBytes(20).toString('hex');
        user.resetPasswordToken = crypto.createHash('sha256').update(resetToken).digest('hex');
        user.resetPasswordExpire = Date.now() + 10 * 60 * 1000; // 10 minutes
        await user.save({ validateBeforeSave: false });
        
        const resetUrl = `${req.protocol}://${req.get('host')}/auth/reset-password/${resetToken}`;
        const message = `You are receiving this email because you requested a password reset. Please follow this link: \n\n ${resetUrl}`;
        
        await sendEmail({
            email: user.email,
            subject: 'Password Reset Instructions',
            message
        });
        res.render('forgot-password', { message: 'An email has been sent.' });
    } catch (error) {
        console.error(error);
        res.status(500).send('Email could not be sent.');
    }
};

// @desc    Reset password
// @route   POST /auth/reset-password/:resetToken
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
        user.password = req.body.password;
        user.resetPasswordToken = undefined;
        user.resetPasswordExpire = undefined;
        await user.save();
        res.redirect('/auth/login');
    } catch (error) {
        console.error(error);
        res.status(500).send('Server error.');
    }
};

// --- NEW OTP FUNCTIONS ---

// @desc    Render the OTP verification page
// @route   GET /auth/verify-otp
const renderOtpPage = (req, res) => {
    const email = req.session.otpEmail;
    console.log(`[AUTH] Rendering OTP page. Session email: ${email}`);
    if (!email) {
        console.log(`[AUTH] No email in session, redirecting to login`);
        return res.redirect('/auth/login');
    }
    res.render('verify-otp', { 
        pageTitle: 'Verify OTP', 
        email: email, 
        error: null 
    });
};

// @desc    Handle the OTP submission
// @route   POST /auth/verify-otp
const verifyOtp = async (req, res) => {
    const { otp } = req.body;
    const email = req.session.otpEmail;

    console.log(`[AUTH] Verifying OTP: ${otp} for email: ${email}`);

    if (!email) {
        console.log(`[AUTH] No email in session during verification, redirecting to login`);
        return res.redirect('/auth/login');
    }

    try {
        const user = await User.findOne({ 
            email: email,
            otp: otp,
            otpExpire: { $gt: Date.now() } // Check if OTP matches and is not expired
        });

        if (!user) {
            console.log(`[AUTH] Invalid or expired OTP for ${email}`);
            // --- Invalid or expired OTP ---
            return res.render('verify-otp', {
                pageTitle: 'Verify OTP',
                email: email,
                error: 'Invalid or expired OTP. Please try again.'
            });
        }

        console.log(`[AUTH] OTP verified for ${user.username}`);

        // --- OTP is correct! ---
        
        // 1. Log the user in
        req.session.userId = user._id;

        // 2. Clear the OTP fields
        user.otp = undefined;
        user.otpExpire = undefined;
        await user.save();

        // 3. Clear the session email
        req.session.otpEmail = undefined;

        console.log(`[AUTH] Login successful, session userId set: ${req.session.userId}`);

        // IMPORTANT: Save session before redirect
        req.session.save((err) => {
            if (err) {
                console.error('[AUTH] Session save error after OTP:', err);
                return res.status(500).send('Server error during login.');
            }
            // 4. Redirect to dashboard
            if (req.headers.accept && req.headers.accept.includes('application/json')) {
                return res.json({ message: 'Login successful', user: { id: user._id, username: user.username } });
            }
            console.log(`[AUTH] Redirecting to /dashboard`);
            res.redirect('/dashboard');
        });

    } catch (error) {
        console.error('[AUTH] OTP verification error:', error);
        res.status(500).send('Server error.');
    }
};


module.exports = {
    renderLoginPage,
    renderRegisterPage,
    registerUser,
    loginUser,
    forgotPassword,
    resetPassword,
    renderOtpPage,
    verifyOtp
};