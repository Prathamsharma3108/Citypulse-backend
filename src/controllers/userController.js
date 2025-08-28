// controllers/userController.js

const User = require('../models/User');

// @desc    Register a new user
// @route   POST /api/users/register
// @access  Public
const registerUser = async (req, res) => {
  const { name, email, password } = req.body;

  try {
    // Check if user already exists
    const userExists = await User.findOne({ email });

    if (userExists) {
      return res.status(400).send('User already exists'); // Or render an error page
    }

    // Create a new user instance
    const user = new User({
      name,
      email,
      password,
    });

    // The password will be hashed by the .pre('save') middleware in the model
    await user.save();
    
    console.log('User registered successfully:', user.name);
    res.redirect('/login'); // Redirect to login page after successful registration

  } catch (error) {
    console.error(error);
    res.status(500).send('Server error');
  }
};

// @desc    Auth user & get token
// @route   POST /api/users/login
// @access  Public
// ... existing registerUser function

const loginUser = async (req, res) => {
  const { email, password } = req.body;

  try {
    const user = await User.findOne({ email });

    if (user && (await user.matchPassword(password))) {
      // Create a session for the user
      req.session.userId = user._id;
      
      console.log('Login successful, session created for:', user.name);
      res.redirect('/dashboard'); // Redirect to the EJS dashboard page
    } else {
      // Re-render login page with an error message
      res.render('login', { error: 'Invalid email or password' });
    }
  } catch (error) {
    console.error(error);
    res.status(500).send('Server error');
  }
};

module.exports = {
  registerUser,
  loginUser,
};

module.exports = {
  registerUser,
  loginUser,
};