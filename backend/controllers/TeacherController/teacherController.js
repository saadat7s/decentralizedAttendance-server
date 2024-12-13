// controllers\TeacherController\teacherController.js

const Session = require('../../models/session');
const Class = require('../../models/class');
const Teacher = require('../../models/teacher')
const Student = require('../../models/student')
const User = require('../../models/user');
const AttendanceRecord = require('../../models/attendanceRecord');
const { validationResult } = require('express-validator');
const session = require('../../models/session');
const student = require('../../models/student');
const { default: mongoose } = require('mongoose');


// Get list of classes assigned to the logged-in teacher
exports.getAssignedClasses = async (req, res) => {
    try {
        // Find teacher based on the user ID in the request
        const teacher = await Teacher.findOne({ user: req.user.id });

        // If teacher not found, return a 404 error
        if (!teacher) {
            return res.status(404).json({ message: 'Teacher not found' });
        }

        // Find the classes assigned to the teacher
        const classes = await Class.find({ 'teacher.id': req.user.id });

        // If no classes are assigned to the teacher, send a 404 with a message
        if (classes.length === 0) {
            return res.status(404).json({ message: 'No classes assigned to your account.' });
        }

        // Map the class data to match the frontend requirements
        const mappedClasses = classes.map((cls) => ({
            id: cls._id.toString(),  // Ensure the ID is stringified for frontend use
            name: `(${cls.courseId}) ${cls.courseName}`, // Format: (CS 222) Data Structures
        }));

        // Send the response with the mapped classes
        res.status(200).json({
            classes: mappedClasses  // Return the classes to the frontend
        });

    } catch (error) {
        // Handle any errors that occur during the process
        console.error('Error fetching classes:', error);
        res.status(500).json({ message: 'Unable to load class details. Please try again.' });
    }
};


exports.getStudentsByClass = async (req, res) => {
    const { classId } = req.params;

    try {
        // Find the class by ID
        const classDetails = await Class.findById(classId);

        if (!classDetails) {
            return res.status(404).json({ message: 'Class not found' });
        }

        if (classDetails.students.length === 0) {
            return res.status(404).json({ message: 'No students assigned to class yet' });
        }

        // Step 1: Find the users (students) by their names
        const userDetails = await User.find({ name: { $in: classDetails.students } });

        if (userDetails.length === 0) {
            return res.status(404).json({ message: 'No users found with the given names' });
        }

        // Step 2: Get the student details from the Student model using the user IDs
        const studentDetails = await Student.find({ 'user': { $in: userDetails.map(user => user._id) } });

        if (studentDetails.length === 0) {
            return res.status(404).json({ message: 'No matching students found in the Student model' });
        }

        // Step 3: Map the students' data to include id, name, and rollNumber
        const mappedStudents = studentDetails.map(student => {
            const user = userDetails.find(u => u._id.toString() === student.user.toString());
            return {
                id: user._id.toString(),
                studentName: user.name,
                rollNumber: student.rollNumber // Roll number from Student model
            };
        });

        // Send the response with mapped students
        res.status(200).json({
            message: "Sent Mapped Students",
            students: mappedStudents
        });

    } catch (error) {
        console.error('Error fetching students for class:', error);
        res.status(500).json({ message: 'Unable to load students. Please try again.' });
    }
};


// get session by class

exports.getSessionByClass = async (req, res) => {

    // getting classId from the req object
    const { classId } = req.params;

    try {
        // finding session based on the class Id
        const sessions = await Session.find({ classId });

        // if no sessions
        if (sessions.length === 0) {
            return res.status(404).json({ message: "No sessions found for this class" });
        }

        // mapping the sessions
        const mappedSessions = sessions.map(session => ({
            id: session._id.toString(),
            sessionName: session.name,
            sessionDate: session.date,
        }))

        // Send the response with mapped sessions
        res.status(200).json({
            message: "Sent Mapped Sessions",
            sessions: mappedSessions
        });


    } catch (error) {
        console.error("fetching session errored", error);
        return res.status(500).json({ message: "Unable to load sessions" });

    }



};

// start a session upon session selection
exports.startSessionById = async (req, res) => {

    const { sessionId } = req.params;

    try {
        let session = await Session.findById(sessionId);
        if (!session) {
            return res.status(404).json({ message: 'Session not found' });
        }

        // Check if the session has already started
        if (session.isStarted) {
            session = await Session.aggregate([
                {
                    $match: {
                        _id: new mongoose.Types.ObjectId(sessionId)
                    }
                },
                {
                    $lookup: {
                        from: 'attendancerecords',
                        localField: '_id',
                        foreignField: 'session',
                        as: 'attendance'
                    }
                },
                {
                    $addFields: {
                        attendance: {
                            $map: {
                                input: '$attendance',
                                as: 'attendanceIds',
                                in: '$$attendanceIds.student',
                            }
                        }
                    }
                }
            ])
            return res.status(200).json({ message: 'Session loaded.', session: session[0] });
        }
        // update the isStarted field
        session.isStarted = true;
        session.startTime = new Date().toISOString();

        // update the document
        await session.save();

        res.status(200).json(
            {
                message: "Session has started successfully upon selecting session",
                session: {
                    id: session._id.toString(),
                    sessionName: session.name,
                    isStarted: session.isStarted,

                }
            });
    }
    catch (error) {
        console.error('Error starting session', error);
        res.status(500).json({ message: 'Unable to start session. Please try again.' });
    }

};


exports.finalizeAttendance = async (req, res) => {
    const { students, sessionId } = req.body;
    const teacherId = req.user.id

    if (sessionId && students && students.length > 0) {
        try {
            //Finalizing attendance in db for each student
            for (std of students) {
                let currentStudentAttendance = await AttendanceRecord.findOne({ student: std, session: sessionId });

                //edge case: student hasnt created attendance record and teachers makes one for him
                if (!currentStudentAttendance) {
                    currentStudentAttendance = await AttendanceRecord.create({ session: sessionId, student: std, markedBy: std, studentSignature: std })
                }

                //Todo: Push to blockchain

                currentStudentAttendance.isFinalized = true;
                currentStudentAttendance.isPresent = true;
                currentStudentAttendance.markedBy = teacherId;

                await currentStudentAttendance.save();
            }

            const classSession = await Session.findById(sessionId);
            classSession.ended = true;
            await classSession.save();

            return res.status(200).json({ message: "Session Attendance Submitted.", classSession })
        } catch (error) {
            console.log(error)
            res.status(500).json({ message: "Internal Server Error", error: error.message })
        }
    }
    else {
        res.status(401).json({ message: 'Students and SessionId are needed.' })
    }
}