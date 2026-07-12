// backend/src/controllers/fuelLogsController.js
const pool = require('../config/db');

// GET /fuel-logs
const getFuelLogs = async (req, res) => {
  try {
    const { rows } = await pool.query(`
      SELECT f.*, v.registration_number AS vehicle_name
      FROM fuel_logs f
      JOIN vehicles v ON f.vehicle_id = v.id
      ORDER BY f.created_at DESC
    `);
    res.json(rows);
  } catch (error) {
    console.error('Error fetching fuel logs:', error);
    res.status(500).json({ message: 'Error fetching fuel logs' });
  }
};

// POST /fuel-logs
const createFuelLog = async (req, res) => {
  const { vehicle_id, trip_id, liters, cost, date } = req.body;

  if (!vehicle_id || liters === undefined || cost === undefined) {
    return res.status(400).json({ message: 'vehicle_id, liters, and cost are required' });
  }

  const numLiters = Number(liters);
  const numCost = Number(cost);

  if (numLiters <= 0) {
    return res.status(400).json({ message: 'Liters must be greater than 0' });
  }
  if (numCost <= 0) {
    return res.status(400).json({ message: 'Cost must be greater than 0' });
  }

  try {
    const { rows } = await pool.query(
      `INSERT INTO fuel_logs (vehicle_id, trip_id, liters, cost, date)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING *`,
      [vehicle_id, trip_id || null, numLiters, numCost, date || new Date().toISOString().split('T')[0]]
    );
    res.status(201).json(rows[0]);
  } catch (error) {
    console.error('Error logging fuel:', error);
    res.status(500).json({ message: 'Error logging fuel' });
  }
};

module.exports = {
  getFuelLogs,
  createFuelLog
};
