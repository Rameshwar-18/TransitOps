require('dotenv').config();
const express = require('express');
const cors = require('cors');
const authRoutes = require('./routes/authRoutes');
const tripsRoutes = require('./src/routes/trips');
const maintenanceRoutes = require('./src/routes/maintenance');
const fuelLogsRoutes = require('./src/routes/fuelLogs');
const expensesRoutes = require('./src/routes/expenses');
const analyticsRoutes = require('./src/routes/analytics');

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

app.use('/auth', authRoutes);
app.use('/trips', tripsRoutes);
app.use('/maintenance', maintenanceRoutes);
app.use('/fuel-logs', fuelLogsRoutes);
app.use('/expenses', expensesRoutes);
app.use('/analytics', analyticsRoutes);

app.get('/', (req, res) => {
  res.json({ message: 'TransitOps API is running' });
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});

