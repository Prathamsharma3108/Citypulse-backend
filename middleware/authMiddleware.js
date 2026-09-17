const User = require('../models/User');

const protect = async (req, res, next) => {
  // Check if a user ID exists in the session
  if (req.session.userId) {
    try {
      // Find the user by the ID stored in the session and attach it to the request
      req.user = await User.findById(req.session.userId).select('-password');
      if (!req.user) {
        if (req.headers.accept && req.headers.accept.includes('application/json')) {
          return res.status(401).json({ message: 'Not authorized' });
        }
        return res.redirect('/auth/login');
      }
      next(); // If user is found, proceed to the next function
    } catch (error) {
      console.error(error);
      if (req.headers.accept && req.headers.accept.includes('application/json')) {
        return res.status(401).json({ message: 'Not authorized' });
      }
      res.redirect('/auth/login'); // If error, redirect to login
    }
  } else {
    // If there is no session userId, return 401 for JSON requests or redirect
    if (req.headers.accept && req.headers.accept.includes('application/json')) {
      return res.status(401).json({ message: 'Not authorized' });
    }
    res.redirect('/auth/login');
  }
};

module.exports = { protect };