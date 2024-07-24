const { validationResult } = require('express-validator');
const Session = require('../../models/session');
const Class = require('../../models/class');
const AttendanceRecord = require('../../models/attendanceRecord');

exports.startSession = async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }

    const { name, startTime, endTime, classId } = req.body;
    const teacherId = req.user.id;

    try {
        const classInfo = await Class.findOne({ courseId: classId }).populate('students');
        if (!classInfo) {
            return res.status(404).json({ msg: 'Class not found' });
        }

        if (classInfo.teacher.toString() !== teacherId) {
            return res.status(403).json({ msg: 'You are not authorized to start a session for this class' });
        }

        const session = new Session({
            name,
            startTime,
            endTime,
            class: classInfo._id,
            teacher: teacherId,
            students: classInfo.students
        });

        await session.save();

        // Create attendance records for each student initially unmarked
        const attendanceRecords = classInfo.students.map(student => ({
            session: session._id,
            student: student._id,
            markedBy: teacherId,
            isPresent: false
        }));

        await AttendanceRecord.insertMany(attendanceRecords);

        res.status(201).json({ msg: 'Session started successfully', session });
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server error');
    }
};
