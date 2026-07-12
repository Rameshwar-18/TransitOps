// backend/src/controllers/analyticsController.js
const pool = require('../config/db');

// GET /analytics
const getAnalytics = async (req, res) => {
  try {
    // 1. Fuel Efficiency (km/l) = sum(actual_distance) / sum(liters) across Completed trips
    const fuelLogsRes = await pool.query('SELECT SUM(liters) AS total_liters FROM fuel_logs');
    const completedTripsRes = await pool.query("SELECT SUM(actual_distance) AS total_distance FROM trips WHERE status = 'Completed'");

    const totalLiters = Number(fuelLogsRes.rows[0].total_liters || 0);
    const totalDistance = Number(completedTripsRes.rows[0].total_distance || 0);
    const fuelEfficiency = totalLiters > 0 ? (totalDistance / totalLiters).toFixed(2) : '0.00';

    // 2. Fleet Utilization % = (count of vehicles 'On Trip') / (all active/not Retired vehicles)
    const activeVehiclesRes = await pool.query("SELECT COUNT(*) AS count FROM vehicles WHERE status != 'Retired'");
    const onTripVehiclesRes = await pool.query("SELECT COUNT(*) AS count FROM vehicles WHERE status = 'On Trip'");

    const totalActive = Number(activeVehiclesRes.rows[0].count || 0);
    const totalOnTrip = Number(onTripVehiclesRes.rows[0].count || 0);
    const utilization = totalActive > 0 ? ((totalOnTrip / totalActive) * 100).toFixed(1) : '0.0';

    // 3. Operational Cost = sum(fuel_logs.cost) + sum(maintenance_logs.cost)
    const fuelCostRes = await pool.query('SELECT SUM(cost) AS total_fuel_cost FROM fuel_logs');
    const maintCostRes = await pool.query('SELECT SUM(cost) AS total_maint_cost FROM maintenance_logs');

    const totalFuelCost = Number(fuelCostRes.rows[0].total_fuel_cost || 0);
    const totalMaintCost = Number(maintCostRes.rows[0].total_maint_cost || 0);
    const operationalCost = totalFuelCost + totalMaintCost;

    // 4. Vehicle ROI % = ((Total Revenue - Operational Cost) / Operational Cost) * 100
    const revenueRes = await pool.query("SELECT SUM(revenue) AS total_revenue FROM trips WHERE status = 'Completed'");
    const totalRevenue = Number(revenueRes.rows[0].total_revenue || 0);
    
    let roi = '0.0';
    if (operationalCost > 0) {
      roi = (((totalRevenue - operationalCost) / operationalCost) * 100).toFixed(1);
    } else if (totalRevenue > 0) {
      roi = '100.0';
    }

    // 5. Monthly Revenue - sum(revenue) grouped by month, last 6 months
    // We will query all completed trips with revenue and group them in JS to support both mock & Postgres easily
    const allCompletedTrips = await pool.query("SELECT completed_at, revenue FROM trips WHERE status = 'Completed' AND revenue IS NOT NULL");
    
    const monthlyRevMap = {};
    // Pre-populate last 6 months with 0 to ensure the chart looks nice
    for (let i = 5; i >= 0; i--) {
      const d = new Date();
      d.setMonth(d.getMonth() - i);
      const label = d.toLocaleString('default', { month: 'short', year: '2-digit' });
      monthlyRevMap[label] = 0;
    }

    allCompletedTrips.rows.forEach(t => {
      if (t.completed_at) {
        const date = new Date(t.completed_at);
        const label = date.toLocaleString('default', { month: 'short', year: '2-digit' });
        if (monthlyRevMap[label] !== undefined) {
          monthlyRevMap[label] += Number(t.revenue || 0);
        } else {
          monthlyRevMap[label] = Number(t.revenue || 0);
        }
      }
    });

    const monthlyRevenue = Object.keys(monthlyRevMap).map(key => ({
      month: key,
      revenue: Number(monthlyRevMap[key].toFixed(2))
    }));

    // 6. Top Costliest Vehicles = sum(fuel_logs.cost) + sum(maintenance_logs.cost) per vehicle
    // Query fuel logs per vehicle
    const fuelCostPerVeh = await pool.query('SELECT vehicle_id, SUM(cost) AS cost FROM fuel_logs GROUP BY vehicle_id');
    // Query maintenance logs per vehicle
    const maintCostPerVeh = await pool.query('SELECT vehicle_id, SUM(cost) AS cost FROM maintenance_logs GROUP BY vehicle_id');
    // Query all vehicles to get names
    const vehiclesList = await pool.query('SELECT id, registration_number FROM vehicles');

    const costMap = {};
    vehiclesList.rows.forEach(v => {
      costMap[v.id] = { name: v.registration_number, cost: 0 };
    });

    fuelCostPerVeh.rows.forEach(f => {
      if (costMap[f.vehicle_id]) {
        costMap[f.vehicle_id].cost += Number(f.cost || 0);
      }
    });

    maintCostPerVeh.rows.forEach(m => {
      if (costMap[m.vehicle_id]) {
        costMap[m.vehicle_id].cost += Number(m.cost || 0);
      }
    });

    const topCostliestVehicles = Object.keys(costMap)
      .map(id => ({
        name: costMap[id].name,
        cost: Number(costMap[id].cost.toFixed(2))
      }))
      .sort((a, b) => b.cost - a.cost)
      .slice(0, 5);

    res.json({
      summary: {
        fuelEfficiency,
        utilization,
        operationalCost,
        roi
      },
      monthlyRevenue,
      topCostliestVehicles
    });
  } catch (error) {
    console.error('Error fetching analytics:', error);
    res.status(500).json({ message: 'Error fetching analytics' });
  }
};

module.exports = {
  getAnalytics
};
