// backend/src/controllers/tripController.js
const pool = require('../config/db');

// Helper functions (acting as the teammates' exported functions in-process)
const getAvailableVehiclesForDispatch = async () => {
  const { rows } = await pool.query("SELECT * FROM vehicles WHERE status = 'Available'");
  return rows;
};

const getEligibleDriversForDispatch = async () => {
  const { rows } = await pool.query("SELECT * FROM drivers WHERE status = 'Available'");
  return rows;
};

// GET /trips
const getTrips = async (req, res) => {
  try {
    const { rows } = await pool.query(`
      SELECT t.*, v.registration_number AS vehicle_name, d.name AS driver_name
      FROM trips t
      JOIN vehicles v ON t.vehicle_id = v.id
      JOIN drivers d ON t.driver_id = d.id
      ORDER BY t.created_at DESC
    `);
    res.json(rows);
  } catch (error) {
    console.error('Error fetching trips:', error);
    res.status(500).json({ message: 'Error fetching trips' });
  }
};

// GET /trips/eligible-vehicles
const getEligibleVehicles = async (req, res) => {
  try {
    const vehicles = await getAvailableVehiclesForDispatch();
    res.json(vehicles);
  } catch (error) {
    console.error('Error fetching eligible vehicles:', error);
    res.status(500).json({ message: 'Error fetching eligible vehicles' });
  }
};

// GET /trips/eligible-drivers
const getEligibleDrivers = async (req, res) => {
  try {
    const drivers = await getEligibleDriversForDispatch();
    res.json(drivers);
  } catch (error) {
    console.error('Error fetching eligible drivers:', error);
    res.status(500).json({ message: 'Error fetching eligible drivers' });
  }
};

// POST /trips (Create a Draft trip)
const createTrip = async (req, res) => {
  const { source, destination, vehicle_id, driver_id, cargo_weight, planned_distance, revenue } = req.body;

  if (!source || !destination || !vehicle_id || !driver_id || cargo_weight === undefined) {
    return res.status(400).json({ message: 'Missing required trip fields' });
  }

  try {
    // 1. Fetch vehicle and check load capacity
    const vehResult = await pool.query('SELECT * FROM vehicles WHERE id = $1', [vehicle_id]);
    if (vehResult.rows.length === 0) {
      return res.status(400).json({ message: 'Selected vehicle does not exist' });
    }
    const vehicle = vehResult.rows[0];

    if (Number(cargo_weight) > Number(vehicle.max_load_capacity)) {
      return res.status(400).json({
        message: `Cargo weight exceeds vehicle capacity. Vehicle limit: ${vehicle.max_load_capacity} kg, Requested: ${cargo_weight} kg`
      });
    }

    // 2. Server-side validation for availability
    if (vehicle.status !== 'Available') {
      return res.status(400).json({ message: 'Selected vehicle is not Available' });
    }

    const drvResult = await pool.query('SELECT * FROM drivers WHERE id = $1', [driver_id]);
    if (drvResult.rows.length === 0) {
      return res.status(400).json({ message: 'Selected driver does not exist' });
    }
    const driver = drvResult.rows[0];

    if (driver.status !== 'Available') {
      return res.status(400).json({ message: 'Selected driver is not Available' });
    }

    // 3. Insert Draft Trip
    const { rows } = await pool.query(
      `INSERT INTO trips (source, destination, vehicle_id, driver_id, cargo_weight, planned_distance, revenue, status)
       VALUES ($1, $2, $3, $4, $5, $6, $7, 'Draft')
       RETURNING *`,
      [source, destination, vehicle_id, driver_id, cargo_weight, planned_distance, revenue]
    );

    res.status(201).json(rows[0]);
  } catch (error) {
    console.error('Error creating trip:', error);
    res.status(500).json({ message: 'Error creating trip' });
  }
};

// PATCH /trips/:id/dispatch (Draft -> Dispatched)
const dispatchTrip = async (req, res) => {
  const { id } = req.params;
  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    // 1. Fetch trip first
    const tripResult = await client.query('SELECT * FROM trips WHERE id = $1', [id]);
    if (tripResult.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ message: 'Trip not found' });
    }
    const trip = tripResult.rows[0];

    if (trip.status !== 'Draft') {
      await client.query('ROLLBACK');
      return res.status(400).json({ message: 'Only Draft trips can be dispatched' });
    }

    // 2. Re-select vehicle and driver in transaction to check current status
    const vehResult = await client.query('SELECT status FROM vehicles WHERE id = $1', [trip.vehicle_id]);
    const drvResult = await client.query('SELECT status FROM drivers WHERE id = $1', [trip.driver_id]);

    if (vehResult.rows.length === 0 || drvResult.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(400).json({ message: 'Vehicle or Driver not found' });
    }

    const vehicleStatus = vehResult.rows[0].status;
    const driverStatus = drvResult.rows[0].status;

    if (vehicleStatus === 'On Trip' || driverStatus === 'On Trip') {
      await client.query('ROLLBACK');
      return res.status(400).json({ message: 'Vehicle or Driver is already On Trip' });
    }

    // 3. Update status to Dispatched
    const { rows: updatedTrip } = await client.query(
      "UPDATE trips SET status = 'Dispatched', dispatched_at = NOW() WHERE id = $1 RETURNING *",
      [id]
    );

    // 4. Set vehicle and driver status to 'On Trip'
    await client.query("UPDATE vehicles SET status = 'On Trip' WHERE id = $1", [trip.vehicle_id]);
    await client.query("UPDATE drivers SET status = 'On Trip' WHERE id = $1", [trip.driver_id]);

    await client.query('COMMIT');
    res.json(updatedTrip[0]);
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error dispatching trip:', error);
    res.status(500).json({ message: 'Error dispatching trip' });
  } finally {
    client.release();
  }
};

// PATCH /trips/:id/complete (Dispatched -> Completed)
const completeTrip = async (req, res) => {
  const { id } = req.params;
  const { actual_distance, fuel_consumed, fuel_cost } = req.body;

  if (actual_distance === undefined || fuel_consumed === undefined) {
    return res.status(400).json({ message: 'actual_distance and fuel_consumed are required to complete a trip' });
  }

  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    // 1. Fetch trip
    const tripResult = await client.query('SELECT * FROM trips WHERE id = $1', [id]);
    if (tripResult.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ message: 'Trip not found' });
    }
    const trip = tripResult.rows[0];

    if (trip.status !== 'Dispatched') {
      await client.query('ROLLBACK');
      return res.status(400).json({ message: 'Only Dispatched trips can be completed' });
    }

    // 2. Set trip Completed
    const { rows: updatedTrip } = await client.query(
      `UPDATE trips 
       SET status = 'Completed', completed_at = NOW(), actual_distance = $1, fuel_consumed = $2
       WHERE id = $3 
       RETURNING *`,
      [actual_distance, fuel_consumed, id]
    );

    // 3. Revert vehicle to Available & update odometer
    await client.query(
      "UPDATE vehicles SET status = 'Available', odometer = odometer + $1 WHERE id = $2",
      [actual_distance, trip.vehicle_id]
    );

    // 4. Revert driver to Available
    await client.query(
      "UPDATE drivers SET status = 'Available' WHERE id = $1",
      [trip.driver_id]
    );

    // 5. Insert fuel_logs row (cost defaults to null if not provided, fallback to 0 in cost validation if DB strict)
    const cost = fuel_cost ? Number(fuel_cost) : 1.0; // Avoid database constraint check (cost > 0)
    await client.query(
      `INSERT INTO fuel_logs (vehicle_id, trip_id, liters, cost, date)
       VALUES ($1, $2, $3, $4, CURRENT_DATE)`,
      [trip.vehicle_id, id, fuel_consumed, cost]
    );

    await client.query('COMMIT');
    res.json(updatedTrip[0]);
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error completing trip:', error);
    res.status(500).json({ message: 'Error completing trip' });
  } finally {
    client.release();
  }
};

// PATCH /trips/:id/cancel (Draft/Dispatched -> Cancelled)
const cancelTrip = async (req, res) => {
  const { id } = req.params;
  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    // 1. Fetch trip
    const tripResult = await client.query('SELECT * FROM trips WHERE id = $1', [id]);
    if (tripResult.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ message: 'Trip not found' });
    }
    const trip = tripResult.rows[0];

    if (trip.status === 'Completed' || trip.status === 'Cancelled') {
      await client.query('ROLLBACK');
      return res.status(400).json({ message: `Cannot cancel a trip that is already ${trip.status}` });
    }

    // 2. Set status to Cancelled
    const { rows: updatedTrip } = await client.query(
      "UPDATE trips SET status = 'Cancelled' WHERE id = $1 RETURNING *",
      [id]
    );

    // 3. Revert vehicle + driver to Available only if they were actually Dispatched (i.e. not Draft)
    if (trip.status === 'Dispatched') {
      await client.query("UPDATE vehicles SET status = 'Available' WHERE id = $1", [trip.vehicle_id]);
      await client.query("UPDATE drivers SET status = 'Available' WHERE id = $1", [trip.driver_id]);
    }

    await client.query('COMMIT');
    res.json(updatedTrip[0]);
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error cancelling trip:', error);
    res.status(500).json({ message: 'Error cancelling trip' });
  } finally {
    client.release();
  }
};

module.exports = {
  getTrips,
  getEligibleVehicles,
  getEligibleDrivers,
  createTrip,
  dispatchTrip,
  completeTrip,
  cancelTrip
};
