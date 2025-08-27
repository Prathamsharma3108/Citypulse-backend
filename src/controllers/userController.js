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
const loginUser = async (req, res) => {
  const { email, password } = req.body;

  try {
    // Check for user by email
    const user = await User.findOne({ email });

    // Check if user exists and password matches
    if (user && (await user.matchPassword(password))) {
      console.log('Login successful for user:', user.name);
      // For now, we'll just redirect to a dashboard.
      // Later, you'll implement JWT here.
      res.redirect('/dashboard');
    } else {
      res.status(401).send('Invalid email or password'); // Or render login page with an error
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