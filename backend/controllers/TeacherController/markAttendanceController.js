// controllers/TeacherController/markAttendanceController.js

const { validationResult } = require('express-validator');
const Attendance = require('../../models/attendanceRecord');
const Session = require('../../models/session');

exports.markAttendance = async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }

    const { sessionId, studentId } = req.body;
    const teacherId = req.user.id;

    try {
        const session = await Session.findById(sessionId);
        if (!session) {
            return res.status(404).json({ msg: 'Session not found' });
        }

        if (session.teacher.toString() !== teacherId) {
            return res.status(403).json({ msg: 'You are not authorized to mark attendance for this session' });
        }

        const attendance = new Attendance({
            session: sessionId,
            student: studentId,
            markedBy: teacherId
        });

        await attendance.save();

        res.status(201).json({ msg: 'Attendance marked successfully', attendance });
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server error');
    }
};
