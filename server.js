import express from 'express';
import sql from 'mssql';
import cors from 'cors';
import dbConfigs from './dbconfig.js';
import attenRoutes from './routes/attenRoutes.js';
import attendanceLogsRoutes from './routes/attendanceLogsRoutes.js';
import deviceLogsRoutes from './routes/deviceLogsRoutes.js';

const app = express();
const port = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

// Function to test database connection
async function testDbConnection(config) {
  try {
    const pool = await sql.connect(config);
    await pool.request().query('SELECT 1');
    await sql.close();
    console.log(`Successfully connected to database: ${config.database}`);
    return true;
  } catch (error) {
    console.error(`Error connecting to database ${config.database}:`, error.message);
    return false;
  }
}

// Endpoint to test database connection
app.get('/api/testconnection/:dbName', async (req, res) => {
  const { dbName } = req.params;
  const config = dbConfigs[dbName];

  if (!config) {
    return res.status(400).json({ error: 'Invalid database name' });
  }

  const isConnected = await testDbConnection(config);
  res.json({ connected: isConnected });
});

// Use the attenRoutes for /api/atteninfo endpoints
app.use('/api/atteninfo', attenRoutes);

// Use the attendanceLogsRoutes for /api/attendancelogs endpoints
app.use('/api/attendancelogs', attendanceLogsRoutes);

// Use the deviceLogsRoutes for /api/devicelogs endpoints
app.use('/api/devicelogs', deviceLogsRoutes);

// Test connections to all databases when server starts
async function testAllConnections() {
  for (const [dbName, config] of Object.entries(dbConfigs)) {
    await testDbConnection(config);
  }
}

// Global error handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).send('Something broke!');
});

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
  testAllConnections(); // Test all database connections when server starts
});
