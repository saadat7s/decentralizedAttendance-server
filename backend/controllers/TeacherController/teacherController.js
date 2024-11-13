// controllers\TeacherController\teacherController.js

const Session = require('../../models/session');
const Class = require('../../models/class');
const AttendanceRecord = require('../../models/attendanceRecord');
const { validationResult } = require('express-validator');

exports.endSession = async (req, res) => {
    const { sessionId } = req.body;
    const teacherId = req.user.id;

    try {
        const session = await Session.findById(sessionId);
        if (!session) {
            return res.status(404).json({ msg: 'Session not found' });
        }

        if (session.teacher.toString() !== teacherId) {
            return res.status(403).json({ msg: 'You are not authorized to end this session' });
        }

        session.isCompleted = true;
        await session.save();

        res.status(200).json({ msg: 'Session ended successfully', session });
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server error');
    }
};

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


exports.selectClass = async (req, res) => {
    try {
        const classes = await Class.find({ teacher: req.user.id }).populate('students');
        res.json(classes);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server error');
    }
};


exports.startSession = async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }

    const { name, startTime, endTime, classId } = req.body;

    try {
        // Step 1: Validate Class Exists
        const classInfo = await Class.findById(classId).populate('students');
        if (!classInfo) {
            return res.status(404).json({ msg: 'Class not found' });
        }

        // Step 2: Check if Teacher Exists
        if (!classInfo.teacher) {
            return res.status(400).json({ msg: 'Class does not have an assigned teacher' });
        }

        // Step 3: Check for Overlapping Sessions
        const overlappingSession = await Session.findOne({
            class: classId,
            $or: [
                { startTime: { $lt: endTime, $gte: startTime } },
                { endTime: { $gt: startTime, $lte: endTime } }
            ]
        });
        if (overlappingSession) {
            return res.status(400).json({ msg: 'Overlapping session already exists' });
        }

        // Step 4: Create Session
        const session = new Session({
            name,
            startTime,
            endTime,
            class: classId,
            teacher: classInfo.teacher,
            students: classInfo.students.map(student => student._id) // Map student IDs
        });

        await session.save();

        // Step 5: Create Attendance Records
        const attendanceRecords = classInfo.students.map(student => ({
            session: session._id,
            student: student._id,
            markedBy: classInfo.teacher,
            isPresent: false
        }));

        await AttendanceRecord.insertMany(attendanceRecords);

        res.status(201).json({
            msg: 'Session started successfully',
            session,
            attendanceRecords
        });
    } catch (err) {
        console.error('Error starting session:', err.message);
        res.status(500).send('Server error');
    }
};
