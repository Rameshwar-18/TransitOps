// backend/src/routes/analytics.js
const express = require('express');
const router = express.Router();
const { requireAuth } = require('../../middleware/auth');
const requireModuleAccess = require('../middleware/requireModuleAccess');
const { getAnalytics } = require('../controllers/analyticsController');

router.use(requireAuth);

router.get('/', requireModuleAccess('analytics', 'read'), getAnalytics);

module.exports = router;
