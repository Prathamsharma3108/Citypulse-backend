const express = require('express');
const router = express.Router();
const { getAdminDashboardData, deleteUser } = require('../controllers/adminController');
const { protect } = require('../middleware/authMiddleware');
const { admin } = require('../middleware/adminMiddleware');

// All routes in this file are protected and require admin access
router.use(protect, admin);

router.get('/data', getAdminDashboardData);
router.delete('/users/:id', deleteUser);

module.exports = router;