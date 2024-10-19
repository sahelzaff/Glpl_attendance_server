import express from 'express';
import sql from 'mssql';
import dbConfigs from '../dbconfig.js';

const router = express.Router();

// Helper function to create a database connection
const createConnection = async () => {
  try {
    console.log('Attempting to connect with config:', JSON.stringify(dbConfigs.etimetracklite1, null, 2));
    await sql.connect(dbConfigs.etimetracklite1);
    return sql;
  } catch (error) {
    console.error('Error creating database connection:', error);
    throw error;
  }
};

// Get available table names
router.get('/tables', async (req, res) => {
  try {
    await sql.connect(dbConfigs.etimetracklite1);
    const result = await sql.query`
      SELECT TABLE_NAME 
      FROM INFORMATION_SCHEMA.TABLES 
      WHERE TABLE_SCHEMA = 'dbo' 
      AND TABLE_NAME LIKE 'DeviceLogs_%_%' 
      ORDER BY TABLE_NAME DESC
    `;
    await sql.close();

    const tableNames = result.recordset.map(row => row.TABLE_NAME);
    res.json(tableNames);
  } catch (error) {
    console.error('Error fetching table names:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Search device logs
router.get('/', async (req, res) => {
  const { table, userId } = req.query;
  
  if (!table || !userId) {
    return res.status(400).json({ error: 'Table name and User ID are required' });
  }

  try {
    await sql.connect(dbConfigs.etimetracklite1);
    const request = new sql.Request();
    request.input('userId', sql.VarChar, userId);
    
    let query = `SELECT TOP 100
      [DeviceLogId], [DownloadDate], [DeviceId], [UserId], [LogDate], [Direction], 
      [AttDirection], [C1], [C2], [C3], [C4], [C5], [C6], [C7], [WorkCode], [UpdateFlag], 
      [EmployeeImage], [FileName], [Longitude], [Latitude], [IsApproved], 
      [CreatedDate], [LastModifiedDate] AS LastModifiedDate, [LocationAddress], [BodyTemperature], [IsMaskOn]
    FROM ${table} WHERE UserId = @userId ORDER BY LogDate DESC`;
    
    console.log('Executing query:', query);
    console.log('With params:', { userId });

    const result = await request.query(query);
    res.json(result.recordset);
  } catch (error) {
    console.error('Error searching device logs:', error);
    res.status(500).json({ error: 'Internal server error', details: error.message, stack: error.stack });
  } finally {
    await sql.close();
  }
});

// Update device log
router.put('/:id', async (req, res) => {
  const { id } = req.params;
  const { table, ...updateData } = req.body;

  if (!table) {
    return res.status(400).json({ error: 'Table name is required' });
  }

  // Remove LastModified Date from updateData to prevent it from being updated
  delete updateData['LastModified Date'];

  try {
    await sql.connect(dbConfigs.etimetracklite1);
    
    const setClause = Object.keys(updateData)
      .map(key => `[${key}] = @${key}`)
      .join(', ');
    
    const query = `UPDATE ${table} SET ${setClause} WHERE DeviceLogId = @id`;

    const request = new sql.Request();
    request.input('id', sql.Int, id);
    for (const [key, value] of Object.entries(updateData)) {
      request.input(key, value);
    }

    await request.query(query);
    res.json({ message: 'Device log updated successfully' });
  } catch (error) {
    console.error('Error updating device log:', error);
    res.status(500).json({ error: 'Internal server error', details: error.message });
  } finally {
    await sql.close();
  }
});

export default router;
