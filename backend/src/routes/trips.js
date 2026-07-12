// backend/src/routes/trips.js
const express = require('express');
const router = express.Router();
const { requireAuth } = require('../../middleware/auth');
const requireModuleAccess = require('../middleware/requireModuleAccess');
const {
  getTrips,
  getEligibleVehicles,
  getEligibleDrivers,
  createTrip,
  dispatchTrip,
  completeTrip,
  cancelTrip
} = require('../controllers/tripController');

// All routes require authentication
router.use(requireAuth);

router.get('/', requireModuleAccess('trip', 'read'), getTrips);
router.get('/eligible-vehicles', requireModuleAccess('trip', 'write'), getEligibleVehicles);
router.get('/eligible-drivers', requireModuleAccess('trip', 'write'), getEligibleDrivers);
router.post('/', requireModuleAccess('trip', 'write'), createTrip);
router.patch('/:id/dispatch', requireModuleAccess('trip', 'write'), dispatchTrip);
router.patch('/:id/complete', requireModuleAccess('trip', 'write'), completeTrip);
router.patch('/:id/cancel', requireModuleAccess('trip', 'write'), cancelTrip);

module.exports = router;
