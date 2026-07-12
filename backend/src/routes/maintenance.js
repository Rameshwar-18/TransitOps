// backend/src/routes/maintenance.js
const express = require('express');
const router = express.Router();
const { requireAuth } = require('../../middleware/auth');
const requireModuleAccess = require('../middleware/requireModuleAccess');
const {
  getMaintenanceLogs,
  createMaintenanceLog,
  closeMaintenanceLog
} = require('../controllers/maintenanceController');

router.use(requireAuth);

router.get('/', requireModuleAccess('maintenance', 'read'), getMaintenanceLogs);
router.post('/', requireModuleAccess('maintenance', 'write'), createMaintenanceLog);
router.patch('/:id/close', requireModuleAccess('maintenance', 'write'), closeMaintenanceLog);

module.exports = router;
