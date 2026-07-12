// backend/src/routes/fuelLogs.js
const express = require('express');
const router = express.Router();
const { requireAuth } = require('../../middleware/auth');
const requireModuleAccess = require('../middleware/requireModuleAccess');
const { getFuelLogs, createFuelLog } = require('../controllers/fuelLogsController');

router.use(requireAuth);

router.get('/', requireModuleAccess('fuelExpense', 'read'), getFuelLogs);
router.post('/', requireModuleAccess('fuelExpense', 'write'), createFuelLog);

module.exports = router;
