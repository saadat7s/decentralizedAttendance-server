const { validationResult } = require('express-validator');
const AttendanceRecord = require('../../models/attendanceRecord');

exports.markAttendance = async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }

    const { sessionId } = req.body;
    const studentId = req.user.id; // Assuming student is marking their own attendance

    try {
        const attendanceRecord = await AttendanceRecord.findOne({ session: sessionId, student: studentId });
        if (!attendanceRecord) {
            return res.status(404).json({ msg: 'Attendance record not found' });
        }

        attendanceRecord.isPresent = true;
        await attendanceRecord.save();

        res.status(200).json({ msg: 'Attendance marked successfully', attendanceRecord });
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server error');
    }
};
