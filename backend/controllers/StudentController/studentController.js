//controllers\StudentController\studentController.js


const { validationResult } = require('express-validator');
const AttendanceRecord = require('../../models/attendanceRecord');
const Wallet = require('../../models/wallet');


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