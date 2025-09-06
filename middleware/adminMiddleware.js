const admin = (req, res, next) => {
    if (req.user && req.user.isAdmin) {
        next(); // User is an admin, proceed
    } else {
        res.status(403).send('Not authorized as an admin');
    }
};

module.exports = { admin };