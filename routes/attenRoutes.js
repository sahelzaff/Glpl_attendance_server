import express from 'express';
import sql from 'mssql';
import dbConfigs from '../dbconfig.js';

const router = express.Router();

// Endpoint to fetch user info
router.get('/info', async (req, res) => {
  const { userId } = req.query;

  try {
    await sql.connect(dbConfigs.atten);
    const result = await sql.query`
      SELECT TOP 1 u.UserId, u.Name, u.Department, a.AttendanceDateTime as LastAttendance
      FROM Users u
      LEFT JOIN Attendance a ON u.UserId = a.UserId
      WHERE u.UserId = ${userId}
      ORDER BY a.AttendanceDateTime DESC
    `;

    if (result.recordset.length === 0) {
      res.status(404).json({ error: 'User not found' });
    } else {
      res.json(result.recordset[0]);
    }
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'An error occurred while fetching user information' });
  } finally {
    await sql.close();
  }
});

// Endpoint to fetch all AttenInfo data
router.get('/', async (req, res) => {
  const { ticketNo } = req.query;

  try {
    await sql.connect(dbConfigs.atten);
    const result = await sql.query`
      SELECT 
        srno,
        EmpCode,
        TicketNo,
        EntryDate,
        InoutFlag,
        trfFlag,
        UpdateUID,
        Location,
        ErrMsg
      FROM AttenInfo
      WHERE TicketNo = ${ticketNo}
      ORDER BY srno DESC
    `;

    if (result.recordset.length === 0) {
      res.status(404).json({ error: 'No records found' });
    } else {
      res.json(result.recordset);
    }
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'An error occurred while fetching AttenInfo data' });
  } finally {
    await sql.close();
  }
});

// Endpoint to fetch a specific AttenInfo entry by srno
router.get('/:srno', async (req, res) => {
  const { srno } = req.params;

  try {
    await sql.connect(dbConfigs.atten);
    const result = await sql.query`
      SELECT 
        srno,
        EmpCode,
        TicketNo,
        EntryDate,
        InoutFlag,
        trfFlag,
        UpdateUID,
        Location,
        ErrMsg
      FROM AttenInfo
      WHERE srno = ${srno}
    `;

    if (result.recordset.length === 0) {
      res.status(404).json({ error: 'Record not found' });
    } else {
      res.json(result.recordset[0]);
    }
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'An error occurred while fetching the AttenInfo entry' });
  } finally {
    await sql.close();
  }
});

// Add this new route to update an AttenInfo entry
router.put('/:srno', async (req, res) => {
  const { srno } = req.params;
  const updatedEntry = req.body;

  try {
    await sql.connect(dbConfigs.atten);
    await sql.query`
      UPDATE AttenInfo
      SET
        EmpCode = ${updatedEntry.EmpCode},
        TicketNo = ${updatedEntry.TicketNo},
        EntryDate = ${updatedEntry.EntryDate},
        InoutFlag = ${updatedEntry.InoutFlag},
        trfFlag = ${updatedEntry.trfFlag},
        UpdateUID = ${updatedEntry.UpdateUID},
        Location = ${updatedEntry.Location},
        ErrMsg = ${updatedEntry.ErrMsg}
      WHERE srno = ${srno}
    `;

    res.json({ message: 'Entry updated successfully' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'An error occurred while updating the AttenInfo entry' });
  } finally {
    await sql.close();
  }
});

// Add this new route to fetch attendance logs
router.get('/logs', async (req, res) => {
  const { startDate, endDate } = req.query;

  try {
    await sql.connect(dbConfigs.atten);
    const result = await sql.query`
      SELECT 
        a.UserId as employeeId,
        u.Name as name,
        CONVERT(date, a.AttendanceDateTime) as date,
        MIN(CONVERT(time, a.AttendanceDateTime)) as timeIn,
        MAX(CONVERT(time, a.AttendanceDateTime)) as timeOut
      FROM Attendance a
      JOIN Users u ON a.UserId = u.UserId
      WHERE CONVERT(date, a.AttendanceDateTime) BETWEEN ${startDate} AND ${endDate}
      GROUP BY a.UserId, u.Name, CONVERT(date, a.AttendanceDateTime)
      ORDER BY date DESC, name
    `;

    res.json(result.recordset);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'An error occurred while fetching attendance logs' });
  } finally {
    await sql.close();
  }
});

export default router;
