//controllers\StudentController\studentController.js


const { validationResult } = require('express-validator');
const AttendanceRecord = require('../../models/attendanceRecord');
const Wallet = require('../../models/wallet');
const student = require('../../models/student');
const _class = require('../../models/class');

const Session = require('../../models/session');
const Class = require('../../models/class');



exports.markAttendance = async (req, res) => {
  try {
    const { sessionId } = req.body;
    const studentId = req.user.id; // Assuming student is authenticated

    // Find or create the attendance record for the session and student
    let attendanceRecord = await AttendanceRecord.findOne({ session: sessionId, student: studentId });

    if (!attendanceRecord) {
      attendanceRecord = new AttendanceRecord({
        session: sessionId,
        student: studentId,
        isPresent: false,
        isFinalized: false,
      });
    }

    if (attendanceRecord.isPresent) {
      return res.status(400).json({ message: 'Attendance already marked.' });
    }

    // Mark attendance
    attendanceRecord.isPresent = true;
    attendanceRecord.markedAt = new Date();
    await attendanceRecord.save();

    res.status(200).json({ message: 'Attendance marked successfully.', attendanceRecord });
  } catch (err) {
    console.error('Error marking attendance:', err.message);
    res.status(500).json({ message: 'Internal server error', error: err.message });
  }
};







exports.getAttendance = async (req, res) => {
  const { publicKey } = req.params;

  try {
    // Ensure the public key is correctly parsed
    const pubKey = new PublicKey(publicKey);
    const attendanceRecord = await getAttendanceRecord(pubKey);
    res.status(200).json(attendanceRecord);
  } catch (err) {
    console.error('Error fetching attendance record:', err.message);
    res.status(500).send('Server error');
  }
};

exports.getStudentClasses = async (req, res) => {
  const { id } = req.user;
  if (id) {
    try {
      const user = await student.findOne({ user: id })
      if (user) {
        // let studentClasses = await _class.find({ courseName: user.courses })
        let studentClasses = await _class.aggregate([
          {
            $match: {
              courseName: { $in: user.courses }
            }
          },
          {
            $lookup: {
              from: 'sessions',
              localField: '_id',
              foreignField: 'classId',
              as: 'session'
            }
          },
          {
            $lookup: {
              from: 'attendancerecords',
              localField: 'session._id',
              foreignField: 'session',
              as: 'attendance'
            }
          },
          {
            $addFields: {
              session: {
                $last: '$session'
              },
              attendance: {
                $map: {
                  input: '$attendance',
                  as: 'attendanceIds',
                  in: '$$attendanceIds.student'
                }
              }
            }
          }
        ])
        console.log(studentClasses)
        return res.status(200).json({ message: "Student classes fetched.", studentClasses });
      }

      return res.status(400).json({ message: "No user found." })

    } catch (error) {
      console.log(error)
      res.status(500).json({ message: "Internal Server Error.", error: error.message })
    }
  }
  else {
    return res.status(500).json({ message: "No user id provided." })
  }
}


// controllers/StudentController/studentController.js

/**
 * Get attendance records for the logged in student
 */
exports.getStudentAttendance = async (req, res) => {
  const studentId = req.user.id;
  
  try {
    // Get all attendance records for this student
    const attendanceRecords = await AttendanceRecord.find({ student: studentId })
      .populate({
        path: 'session',
        select: 'name date classId',
        populate: {
          path: 'classId',
          select: 'courseName courseId'
        }
      });
    
    if (attendanceRecords.length === 0) {
      return res.status(404).json({ message: 'No attendance records found' });
    }
    
    // Group attendance by class
    const attendanceByClass = {};
    
    for (const record of attendanceRecords) {
      if (!record.session || !record.session.classId) continue;
      
      const classId = record.session.classId._id.toString();
      const className = record.session.classId.courseName;
      const courseId = record.session.classId.courseId;
      
      if (!attendanceByClass[classId]) {
        attendanceByClass[classId] = {
          className,
          courseId,
          sessions: [],
          totalSessions: 0,
          presentCount: 0,
          attendancePercentage: '0%'
        };
      }
      
      attendanceByClass[classId].sessions.push({
        sessionId: record.session._id,
        sessionName: record.session.name,
        date: record.session.date,
        isPresent: record.isPresent,
        markedAt: record.markedAt
      });
      
      attendanceByClass[classId].totalSessions++;
      if (record.isPresent) {
        attendanceByClass[classId].presentCount++;
      }
    }
    
    // Calculate attendance percentage for each class
    Object.keys(attendanceByClass).forEach(classId => {
      const classData = attendanceByClass[classId];
      const percentage = (classData.presentCount / classData.totalSessions) * 100;
      classData.attendancePercentage = percentage.toFixed(2) + '%';
      
      // Sort sessions by date (newest first)
      classData.sessions.sort((a, b) => new Date(b.date) - new Date(a.date));
    });
    
    res.status(200).json({
      message: 'Attendance records retrieved successfully',
      attendanceByClass
    });
    
  } catch (error) {
    console.error('Error retrieving student attendance records:', error);
    res.status(500).json({ 
      message: 'Failed to retrieve attendance records', 
      error: error.message 
    });
  }
};

/**
 * Get attendance for a specific class for the logged in student
 */
exports.getStudentClassAttendance = async (req, res) => {
  const { classId } = req.params;
  const studentId = req.user.id;
  
  try {
    // Find the class
    const classDetails = await Class.findById(classId);
    
    if (!classDetails) {
      return res.status(404).json({ message: 'Class not found' });
    }
    
    // Find all sessions for this class
    const sessions = await Session.find({ classId });
    
    if (sessions.length === 0) {
      return res.status(404).json({ message: 'No sessions found for this class' });
    }
    
    const sessionIds = sessions.map(session => session._id);
    
    // Get attendance records for this student in these sessions
    const attendanceRecords = await AttendanceRecord.find({
      student: studentId,
      session: { $in: sessionIds }
    }).populate('session', 'name date');
    
    // Format the response
    const formattedRecords = attendanceRecords.map(record => ({
      sessionId: record.session._id,
      sessionName: record.session.name,
      date: record.session.date,
      isPresent: record.isPresent,
      markedAt: record.markedAt
    }));
    
    // Sort by date (newest first)
    formattedRecords.sort((a, b) => new Date(b.date) - new Date(a.date));
    
    // Calculate attendance percentage
    const totalSessions = formattedRecords.length;
    const presentCount = formattedRecords.filter(record => record.isPresent).length;
    const attendancePercentage = totalSessions > 0 ? (presentCount / totalSessions) * 100 : 0;
    
    res.status(200).json({
      message: 'Class attendance retrieved successfully',
      className: classDetails.courseName,
      courseId: classDetails.courseId,
      totalSessions,
      presentCount,
      attendancePercentage: attendancePercentage.toFixed(2) + '%',
      records: formattedRecords
    });
    
  } catch (error) {
    console.error('Error retrieving student class attendance:', error);
    res.status(500).json({ 
      message: 'Failed to retrieve class attendance', 
      error: error.message 
    });
  }
};