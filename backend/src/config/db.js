const { Pool } = require('pg');
require('dotenv').config();

const useMock = !process.env.DATABASE_URL;

if (useMock) {
  console.warn('⚠️ DATABASE_URL is not set. Falling back to Local In-Memory Postgres Database Mock!');
}

// In-Memory database store
const mockDb = {
  vehicles: [
    { id: 'v1', registration_number: 'Van-05', max_load_capacity: 500, status: 'Available', odometer: 10000 },
    { id: 'v2', registration_number: 'Truck-02', max_load_capacity: 2000, status: 'Available', odometer: 20000 }
  ],
  drivers: [
    { id: 'd1', name: 'Alex', status: 'Available' },
    { id: 'd2', name: 'Bob', status: 'Available' }
  ],
  trips: [],
  maintenance_logs: [],
  fuel_logs: [],
  expenses: []
};

// SQL query parser/interceptor for the mock database
const mockQuery = async (text, params = []) => {
  const queryStr = text.trim().replace(/\s+/g, ' ');
  const queryLower = queryStr.toLowerCase();

  // 1. SELECT * FROM vehicles WHERE status = 'Available'
  if (queryLower.includes('from vehicles') && queryLower.includes("status = 'available'")) {
    const rows = mockDb.vehicles.filter(v => v.status === 'Available');
    return { rows };
  }

  // 2. SELECT * FROM drivers WHERE status = 'Available'
  if (queryLower.includes('from drivers') && queryLower.includes("status = 'available'")) {
    const rows = mockDb.drivers.filter(d => d.status === 'Available');
    return { rows };
  }

  // 3. SELECT * FROM vehicles WHERE id = $1
  if (queryLower.includes('from vehicles') && queryLower.includes('id = $1')) {
    const vehicle = mockDb.vehicles.find(v => v.id === params[0]);
    return { rows: vehicle ? [vehicle] : [] };
  }

  // 4. SELECT * FROM drivers WHERE id = $1
  if (queryLower.includes('from drivers') && queryLower.includes('id = $1')) {
    const driver = mockDb.drivers.find(d => d.id === params[0]);
    return { rows: driver ? [driver] : [] };
  }

  // 5. SELECT * FROM trips WHERE id = $1
  if (queryLower.includes('from trips') && queryLower.includes('id = $1')) {
    const trip = mockDb.trips.find(t => t.id === params[0]);
    return { rows: trip ? [trip] : [] };
  }

  // 6. SELECT t.* JOIN vehicles JOIN drivers (list all trips)
  if (queryLower.includes('from trips t') && queryLower.includes('join vehicles')) {
    const rows = mockDb.trips.map(t => {
      const v = mockDb.vehicles.find(veh => veh.id === t.vehicle_id);
      const d = mockDb.drivers.find(drv => drv.id === t.driver_id);
      return {
        ...t,
        vehicle_name: v ? v.registration_number : 'Unknown Vehicle',
        driver_name: d ? d.name : 'Unknown Driver'
      };
    });
    return { rows };
  }

  // 7. INSERT INTO trips
  if (queryLower.startsWith('insert into trips')) {
    // fields: source, destination, vehicle_id, driver_id, cargo_weight, planned_distance, revenue, status
    const newTrip = {
      id: `trip-${Math.random().toString(36).substr(2, 9)}`,
      source: params[0],
      destination: params[1],
      vehicle_id: params[2],
      driver_id: params[3],
      cargo_weight: Number(params[4]),
      planned_distance: params[5] ? Number(params[5]) : null,
      actual_distance: null,
      fuel_consumed: null,
      revenue: params[6] ? Number(params[6]) : null,
      status: params[7] || 'Draft',
      created_at: new Date().toISOString(),
      dispatched_at: null,
      completed_at: null
    };
    mockDb.trips.push(newTrip);
    return { rows: [newTrip] };
  }

  // 8. UPDATE trips SET status = 'Dispatched', dispatched_at = NOW() WHERE id = $1
  if (queryLower.includes('update trips') && queryLower.includes('dispatched_at')) {
    const trip = mockDb.trips.find(t => t.id === params[1]);
    if (trip) {
      trip.status = params[0];
      trip.dispatched_at = new Date().toISOString();
    }
    return { rows: trip ? [trip] : [] };
  }

  // 9. UPDATE trips SET status = 'Completed', completed_at = NOW(), actual_distance = $1, fuel_consumed = $2 WHERE id = $3
  if (queryLower.includes('update trips') && queryLower.includes('completed_at')) {
    // params: [status, actual_distance, fuel_consumed, id]
    const trip = mockDb.trips.find(t => t.id === params[3]);
    if (trip) {
      trip.status = params[0];
      trip.actual_distance = Number(params[1]);
      trip.fuel_consumed = Number(params[2]);
      trip.completed_at = new Date().toISOString();
    }
    return { rows: trip ? [trip] : [] };
  }

  // 10. UPDATE trips SET status = $1 WHERE id = $2 (e.g. Cancelled)
  if (queryLower.includes('update trips') && queryLower.includes('status = $1') && !queryLower.includes('dispatched_at') && !queryLower.includes('completed_at')) {
    const trip = mockDb.trips.find(t => t.id === params[1]);
    if (trip) {
      trip.status = params[0];
    }
    return { rows: trip ? [trip] : [] };
  }

  // 11. UPDATE vehicles SET status = $1 WHERE id = $2
  if (queryLower.includes('update vehicles') && queryLower.includes('status = $1') && !queryLower.includes('odometer')) {
    const veh = mockDb.vehicles.find(v => v.id === params[1]);
    if (veh) {
      veh.status = params[0];
    }
    return { rows: veh ? [veh] : [] };
  }

  // 12. UPDATE vehicles SET status = $1, odometer = odometer + $2 WHERE id = $3
  if (queryLower.includes('update vehicles') && queryLower.includes('odometer')) {
    const veh = mockDb.vehicles.find(v => v.id === params[2]);
    if (veh) {
      veh.status = params[0];
      veh.odometer = Number(veh.odometer || 0) + Number(params[1]);
    }
    return { rows: veh ? [veh] : [] };
  }

  // 13. UPDATE drivers SET status = $1 WHERE id = $2
  if (queryLower.includes('update drivers') && queryLower.includes('status = $1')) {
    const drv = mockDb.drivers.find(d => d.id === params[1]);
    if (drv) {
      drv.status = params[0];
    }
    return { rows: drv ? [drv] : [] };
  }

  // 14. SELECT m.* JOIN vehicles (list maintenance logs)
  if (queryLower.includes('from maintenance_logs m') && queryLower.includes('join vehicles')) {
    const rows = mockDb.maintenance_logs.map(m => {
      const v = mockDb.vehicles.find(veh => veh.id === m.vehicle_id);
      return {
        ...m,
        vehicle_name: v ? v.registration_number : 'Unknown Vehicle'
      };
    });
    return { rows };
  }

  // 15. INSERT INTO maintenance_logs (vehicle_id, description, cost, date, status)
  if (queryLower.startsWith('insert into maintenance_logs')) {
    const newLog = {
      id: `maint-${Math.random().toString(36).substr(2, 9)}`,
      vehicle_id: params[0],
      description: params[1],
      cost: params[2] ? Number(params[2]) : null,
      status: params[3] || 'Open',
      date: params[4] || new Date().toISOString().split('T')[0],
      created_at: new Date().toISOString()
    };
    mockDb.maintenance_logs.push(newLog);
    return { rows: [newLog] };
  }

  // 16. UPDATE maintenance_logs SET status = $1 WHERE id = $2
  if (queryLower.includes('update maintenance_logs') && queryLower.includes('status = $1')) {
    const log = mockDb.maintenance_logs.find(m => m.id === params[1]);
    if (log) {
      log.status = params[0];
    }
    return { rows: log ? [log] : [] };
  }

  // 17. SELECT f.* JOIN vehicles (list fuel logs)
  if (queryLower.includes('from fuel_logs f') && queryLower.includes('join vehicles')) {
    const rows = mockDb.fuel_logs.map(f => {
      const v = mockDb.vehicles.find(veh => veh.id === f.vehicle_id);
      return {
        ...f,
        vehicle_name: v ? v.registration_number : 'Unknown Vehicle'
      };
    });
    return { rows };
  }

  // 18. INSERT INTO fuel_logs
  if (queryLower.startsWith('insert into fuel_logs')) {
    const newLog = {
      id: `fuel-${Math.random().toString(36).substr(2, 9)}`,
      vehicle_id: params[0],
      trip_id: params[1] || null,
      liters: Number(params[2]),
      cost: Number(params[3]),
      date: params[4] || new Date().toISOString().split('T')[0],
      created_at: new Date().toISOString()
    };
    mockDb.fuel_logs.push(newLog);
    return { rows: [newLog] };
  }

  // 19. SELECT e.* JOIN vehicles LEFT JOIN trips (list expenses)
  if (queryLower.includes('from expenses e') && queryLower.includes('join vehicles')) {
    const rows = mockDb.expenses.map(e => {
      const v = mockDb.vehicles.find(veh => veh.id === e.vehicle_id);
      const t = mockDb.trips.find(tr => tr.id === e.trip_id);
      return {
        ...e,
        vehicle_name: v ? v.registration_number : 'Unknown Vehicle',
        source: t ? t.source : null,
        destination: t ? t.destination : null
      };
    });
    return { rows };
  }

  // 20. INSERT INTO expenses
  if (queryLower.startsWith('insert into expenses')) {
    const newExp = {
      id: `exp-${Math.random().toString(36).substr(2, 9)}`,
      trip_id: params[0] || null,
      vehicle_id: params[1],
      toll: Number(params[2] || 0),
      other: Number(params[3] || 0),
      date: params[4] || new Date().toISOString().split('T')[0],
      created_at: new Date().toISOString()
    };
    mockDb.expenses.push(newExp);
    return { rows: [newExp] };
  }

  // Generic SELECT * FROM vehicles/drivers
  if (queryLower.includes('from vehicles')) {
    return { rows: mockDb.vehicles };
  }
  if (queryLower.includes('from drivers')) {
    return { rows: mockDb.drivers };
  }

  console.warn('Unhandled query in mockDb:', queryStr, params);
  return { rows: [] };
};

const mockClient = {
  query: mockQuery,
  release: () => {}
};

const mockPool = {
  query: mockQuery,
  connect: async () => mockClient,
  // Helper for direct checks in mock mode
  mockDb
};

module.exports = useMock ? mockPool : new Pool({ connectionString: process.env.DATABASE_URL });
