const User = require('../models/User');

const protect = async (req, res, next) => {
  // Check if a user ID exists in the session
  if (req.session.userId) {
    try {
      // Find the user by the ID stored in the session and attach it to the request
      req.user = await User.findById(req.session.userId).select('-password');
      next(); // If user is found, proceed to the next function
    } catch (error) {
      console.error(error);
      res.redirect('/login'); // If error, redirect to login
    }
  } else {
    // If there is no session userId, redirect the user to the login page
    res.redirect('/login');
  }
};

module.exports = { protect };