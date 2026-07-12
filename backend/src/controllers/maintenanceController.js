// backend/src/controllers/maintenanceController.js
const pool = require('../config/db');

// GET /maintenance
const getMaintenanceLogs = async (req, res) => {
  const { status } = req.query;
  try {
    let queryText = `
      SELECT m.*, v.registration_number AS vehicle_name
      FROM maintenance_logs m
      JOIN vehicles v ON m.vehicle_id = v.id
    `;
    const queryParams = [];

    if (status) {
      queryText += ` WHERE m.status = $1`;
      queryParams.push(status);
    }

    queryText += ` ORDER BY m.created_at DESC`;

    const { rows } = await pool.query(queryText, queryParams);
    res.json(rows);
  } catch (error) {
    console.error('Error fetching maintenance logs:', error);
    res.status(500).json({ message: 'Error fetching maintenance logs' });
  }
};

// POST /maintenance (Open a log, set vehicle to 'In Shop')
const createMaintenanceLog = async (req, res) => {
  const { vehicle_id, description, cost, date } = req.body;

  if (!vehicle_id || !description) {
    return res.status(400).json({ message: 'vehicle_id and description are required' });
  }

  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    // 1. Re-check vehicle exists and is not On Trip
    const vehResult = await client.query('SELECT status FROM vehicles WHERE id = $1', [vehicle_id]);
    if (vehResult.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(400).json({ message: 'Vehicle not found' });
    }

    const vehicleStatus = vehResult.rows[0].status;
    if (vehicleStatus === 'On Trip') {
      await client.query('ROLLBACK');
      return res.status(400).json({ message: 'Cannot place vehicle in maintenance while it is On Trip' });
    }

    // 2. Insert maintenance log
    const { rows } = await client.query(
      `INSERT INTO maintenance_logs (vehicle_id, description, cost, date, status)
       VALUES ($1, $2, $3, $4, 'Open')
       RETURNING *`,
      [vehicle_id, description, cost || null, date || new Date().toISOString().split('T')[0]]
    );

    // 3. Set vehicle status to 'In Shop'
    await client.query("UPDATE vehicles SET status = 'In Shop' WHERE id = $1", [vehicle_id]);

    await client.query('COMMIT');
    res.status(201).json(rows[0]);
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error creating maintenance log:', error);
    res.status(500).json({ message: 'Error creating maintenance log' });
  } finally {
    client.release();
  }
};

// PATCH /maintenance/:id/close (Close a log, set vehicle to 'Available' unless 'Retired')
const closeMaintenanceLog = async (req, res) => {
  const { id } = req.params;
  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    // 1. Fetch maintenance log
    const logResult = await client.query('SELECT * FROM maintenance_logs WHERE id = $1', [id]);
    if (logResult.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ message: 'Maintenance log not found' });
    }
    const log = logResult.rows[0];

    if (log.status === 'Closed') {
      await client.query('ROLLBACK');
      return res.status(400).json({ message: 'Maintenance log is already closed' });
    }

    // 2. Update status of log to Closed
    const { rows: updatedLog } = await client.query(
      "UPDATE maintenance_logs SET status = 'Closed' WHERE id = $1 RETURNING *",
      [id]
    );

    // 3. Check current vehicle status
    const vehResult = await client.query('SELECT status FROM vehicles WHERE id = $1', [log.vehicle_id]);
    if (vehResult.rows.length > 0) {
      const vehicleStatus = vehResult.rows[0].status;
      // Revert vehicle to Available — unless the vehicle's current status is Retired
      if (vehicleStatus !== 'Retired') {
        await client.query("UPDATE vehicles SET status = 'Available' WHERE id = $1", [log.vehicle_id]);
      }
    }

    await client.query('COMMIT');
    res.json(updatedLog[0]);
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error closing maintenance log:', error);
    res.status(500).json({ message: 'Error closing maintenance log' });
  } finally {
    client.release();
  }
};

module.exports = {
  getMaintenanceLogs,
  createMaintenanceLog,
  closeMaintenanceLog
};
