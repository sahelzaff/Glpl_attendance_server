import express from 'express';
import sql from 'mssql';
import dbConfigs from '../dbconfig.js';

const router = express.Router();

router.get('/', async (req, res) => {
  const { EmployeeId } = req.query;

  try {
    await sql.connect(dbConfigs.etimetracklite1);
    const result = await sql.query`
      SELECT TOP 100
        AttendanceLogId,
        AttendanceDate,
        EmployeeId,
        InTime,
        InDeviceId,
        OutTime,
        OutDeviceId,
        Duration,
        LateBy,
        EarlyBy,
        IsOnLeave,
        LeaveType,
        LeaveDuration,
        WeeklyOff,
        Holiday,
        LeaveRemarks,
        PunchRecords,
        ShiftId,
        Present,
        Absent,
        Status,
        StatusCode,
        P1Status,
        P2Status,
        P3Status,
        IsOnSpecialOff,
        SpecialOffType,
        SpecialOffRemark,
        SpecialOffDuration,
        OverTime,
        OverTimeE,
        MissedOutPunch,
        Remarks,
        MissedInPunch,
        C1,
        C2,
        C3,
        C4,
        C5,
        C6,
        C7,
        LeaveTypeId,
        LossOfHours
      FROM AttendanceLogs
      WHERE EmployeeId = ${EmployeeId}
      ORDER BY AttendanceDate DESC
    `;

    if (result.recordset.length === 0) {
      res.status(404).json({ error: 'No records found for this employee' });
    } else {
      res.json(result.recordset);
    }
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'An error occurred while fetching attendance logs', details: err.message });
  } finally {
    await sql.close();
  }
});

// Add this new route to update an AttendanceLog entry
router.put('/:AttendanceLogId', async (req, res) => {
  const { AttendanceLogId } = req.params;
  const updatedEntry = req.body;

  try {
    await sql.connect(dbConfigs.etimetracklite1);
    
    // Construct the UPDATE query dynamically based on the fields provided
    let updateQuery = 'UPDATE AttendanceLogs SET ';
    const updateValues = [];
    Object.keys(updatedEntry).forEach((key, index) => {
      if (key !== 'AttendanceLogId') {
        updateQuery += `${key} = @${key}`;
        updateValues.push({ key: `@${key}`, value: updatedEntry[key] });
        if (index < Object.keys(updatedEntry).length - 1) updateQuery += ', ';
      }
    });
    updateQuery += ' WHERE AttendanceLogId = @AttendanceLogId';

    const request = new sql.Request();
    request.input('AttendanceLogId', sql.Int, AttendanceLogId);
    updateValues.forEach(({ key, value }) => {
      request.input(key.slice(1), value);
    });

    await request.query(updateQuery);

    res.json({ message: 'Entry updated successfully' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'An error occurred while updating the AttendanceLog entry' });
  } finally {
    await sql.close();
  }
});

export default router;
