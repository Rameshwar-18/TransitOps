// backend/src/routes/expenses.js
const express = require('express');
const router = express.Router();
const { requireAuth } = require('../../middleware/auth');
const requireModuleAccess = require('../middleware/requireModuleAccess');
const { getExpenses, createExpense } = require('../controllers/expensesController');

router.use(requireAuth);

router.get('/', requireModuleAccess('fuelExpense', 'read'), getExpenses);
router.post('/', requireModuleAccess('fuelExpense', 'write'), createExpense);

module.exports = router;
