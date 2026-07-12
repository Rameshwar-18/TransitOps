// backend/src/controllers/expensesController.js
const pool = require('../config/db');

// GET /expenses
const getExpenses = async (req, res) => {
  try {
    const { rows } = await pool.query(`
      SELECT e.*, v.registration_number AS vehicle_name, t.source, t.destination,
             COALESCE((SELECT SUM(cost) FROM maintenance_logs WHERE vehicle_id = e.vehicle_id), 0) AS maintenance_cost
      FROM expenses e
      JOIN vehicles v ON e.vehicle_id = v.id
      LEFT JOIN trips t ON e.trip_id = t.id
      ORDER BY e.created_at DESC
    `);
    
    // Format rows with calculated total
    const formatted = rows.map(r => {
      const toll = Number(r.toll || 0);
      const other = Number(r.other || 0);
      const maint = Number(r.maintenance_cost || 0);
      return {
        ...r,
        toll,
        other,
        maintenance_cost: maint,
        total: toll + other + maint
      };
    });

    res.json(formatted);
  } catch (error) {
    console.error('Error fetching expenses:', error);
    res.status(500).json({ message: 'Error fetching expenses' });
  }
};

// POST /expenses
const createExpense = async (req, res) => {
  const { trip_id, vehicle_id, toll, other, date } = req.body;

  if (!vehicle_id) {
    return res.status(400).json({ message: 'vehicle_id is required' });
  }

  const numToll = Number(toll || 0);
  const numOther = Number(other || 0);

  if (numToll < 0) {
    return res.status(400).json({ message: 'Toll must be 0 or greater' });
  }
  if (numOther < 0) {
    return res.status(400).json({ message: 'Other expenses must be 0 or greater' });
  }

  try {
    const { rows } = await pool.query(
      `INSERT INTO expenses (trip_id, vehicle_id, toll, other, date)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING *`,
      [trip_id || null, vehicle_id, numToll, numOther, date || new Date().toISOString().split('T')[0]]
    );
    res.status(201).json(rows[0]);
  } catch (error) {
    console.error('Error adding expense:', error);
    res.status(500).json({ message: 'Error adding expense' });
  }
};

module.exports = {
  getExpenses,
  createExpense
};
