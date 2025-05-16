const express = require('express');
const router = express.Router();
const { getAttendanceRecord } = require('../services/solanaService');

// Middleware for authentication
const { isAuth } = require('../../backend/middlewares/authMiddleware');

// Endpoint to fetch attendance records
router.get('/:accountPublicKey', isAuth, async (req, res) => {
  try {
    const { accountPublicKey } = req.params;

    // Fetch the attendance record from the blockchain
    const attendanceRecord = await getAttendanceRecord(accountPublicKey);

    res.status(200).json({
      message: 'Attendance record fetched successfully.',
      attendanceRecord,
    });
  } catch (err) {
    console.error('Error fetching attendance record:', err.message);
    res.status(500).json({ message: 'Internal server error.', error: err.message });
  }
});

module.exports = router;
