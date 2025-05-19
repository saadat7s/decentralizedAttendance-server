// controllers\TeacherController\teacherController.js

const { storeAttendanceRecord, finalizeAttendanceRecord } = require('../../services/solanaService'); // Import the helper function
const { Keypair } = require('@solana/web3.js');

const Session = require('../../models/session');
const Class = require('../../models/class');
const Teacher = require('../../models/teacher') 
const Student = require('../../models/student')
const User = require('../../models/user');
const AttendanceRecord = require('../../models/attendanceRecord');

const { default: mongoose } = require('mongoose');
const nacl = require('tweetnacl');
const { PublicKey } = require('@solana/web3.js'); // Import PublicKey from Solana Web3.js
const bs58 = require('bs58'); // Import bs58 for Base58 decoding
const Wallet = require('../../models/wallet');




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
    try {
      const { students, sessionId } = req.body;
  
      if (!sessionId || !students || students.length === 0) {
        return res.status(400).json({ message: 'Students and sessionId are required.' });
      }
  
      const finalizedRecords = [];
      const failedRecords = [];
  
      for (const studentId of students) {
        try {
          // Find the attendance record for the given session and student
          const attendanceRecord = await AttendanceRecord.findOne({ session: sessionId, student: studentId });
          if (!attendanceRecord) {
            throw new Error(`Attendance record not found for student ${studentId}`);
          }
          if (attendanceRecord.isFinalized) {
            throw new Error(`Attendance already finalized for student ${studentId}`);
          }
  
          // Check if the record has already been broadcasted to the blockchain
          if (!attendanceRecord.isBroadcasted || !attendanceRecord.broadcastTransactionSignature) {
            console.log(`Broadcasting attendance to blockchain for student ${studentId}...`);
  
            // Store the attendance record on the blockchain
            const attendanceAccountPublicKey = await storeAttendanceRecord(
              attendanceRecord.session.toString(),   // Convert ObjectId to string
              attendanceRecord.student.toString(),   // Convert ObjectId to string
              attendanceRecord.isPresent,            // Presence status
              new Date(attendanceRecord.markedAt).getTime(), // Timestamp
              false                                  // Not finalized yet (we'll do this separately)
            );
  
            // Update the record with the transaction signature
            attendanceRecord.isBroadcasted = true;
            attendanceRecord.broadcastTransactionSignature = attendanceAccountPublicKey;
            await attendanceRecord.save();
            
            console.log(`Attendance successfully broadcasted for student ${studentId}.`);
          }
  
          // Now finalize the attendance record on the blockchain
          console.log(`Finalizing attendance on blockchain for student ${studentId}...`);
          const txSignature = await finalizeAttendanceRecord(
            attendanceRecord.broadcastTransactionSignature
          );
  
          // Update the database record to mark as finalized
          attendanceRecord.isFinalized = true;
          attendanceRecord.finalizationTransactionSignature = txSignature;
          await attendanceRecord.save();
  
          finalizedRecords.push({
            session: attendanceRecord.session,
            student: attendanceRecord.student,
            broadcastTransactionSignature: attendanceRecord.broadcastTransactionSignature,
            finalizationTransactionSignature: txSignature
          });
  
          console.log(`Attendance successfully finalized for student ${studentId}.`);
        } catch (err) {
          console.error(`Failed to finalize attendance for student ${studentId}:`, err.message);
          failedRecords.push({ student: studentId, error: err.message });
        }
      }
  
      // Summarize results
      const successCount = finalizedRecords.length;
      const failCount = failedRecords.length;
  
      res.status(200).json({
        message: `Attendance finalization completed. Successfully finalized: ${successCount}, Failed: ${failCount}`,
        finalizedRecords,
        failedRecords,
      });
    } catch (err) {
      console.error('Error finalizing attendance:', err.message);
      res.status(500).json({ message: 'Internal server error', error: err.message });
    }
  };


  // controllers/TeacherController/teacherController.js

/**
 * Get attendance records for a specific class
 * Teachers can only view attendance for classes they are assigned to
 */
exports.getClassAttendanceRecords = async (req, res) => {
    const { classId } = req.params;
    const teacherId = req.user.id;
  
    try {
      // Check if the class exists and if the teacher is assigned to it
      const classDetails = await Class.findOne({ 
        _id: classId, 
        'teacher.id': teacherId 
      });
  
      if (!classDetails) {
        return res.status(403).json({ 
          message: 'Class not found or you are not authorized to view this class' 
        });
      }
  
      // Find all sessions for this class
      const sessions = await Session.find({ classId });
      
      if (sessions.length === 0) {
        return res.status(404).json({ message: 'No sessions found for this class' });
      }
  
      // Get session IDs
      const sessionIds = sessions.map(session => session._id);
  
      // Get attendance records for all sessions in this class
      const attendanceRecords = await AttendanceRecord.find({
        session: { $in: sessionIds }
      }).populate('student', 'name')
        .populate('session', 'name date');
  
      // Group attendance by session
      const attendanceBySession = {};
      sessions.forEach(session => {
        const sessionId = session._id.toString();
        const sessionRecords = attendanceRecords.filter(
          record => record.session._id.toString() === sessionId
        );
        
        // Calculate attendance stats
        const totalStudents = sessionRecords.length;
        const presentStudents = sessionRecords.filter(record => record.isPresent).length;
        const attendanceRate = totalStudents > 0 ? (presentStudents / totalStudents) * 100 : 0;
        
        attendanceBySession[sessionId] = {
          sessionName: session.name,
          sessionDate: session.date,
          totalStudents,
          presentStudents,
          attendanceRate: attendanceRate.toFixed(2) + '%',
          records: sessionRecords.map(record => ({
            studentId: record.student._id,
            studentName: record.student.name,
            isPresent: record.isPresent,
            markedAt: record.markedAt
          }))
        };
      });
  
      res.status(200).json({
        message: 'Attendance records retrieved successfully',
        className: classDetails.courseName,
        courseId: classDetails.courseId,
        attendanceBySession
      });
  
    } catch (error) {
      console.error('Error retrieving class attendance records:', error);
      res.status(500).json({ 
        message: 'Failed to retrieve attendance records', 
        error: error.message 
      });
    }
  };
  
  /**
   * Get attendance summary for all classes assigned to the teacher
   */
  exports.getTeacherAttendanceSummary = async (req, res) => {
    const teacherId = req.user.id;
  
    try {
      // Find all classes assigned to this teacher
      const classes = await Class.find({ 'teacher.id': teacherId });
      
      if (classes.length === 0) {
        return res.status(404).json({ message: 'No classes assigned to you' });
      }
  
      const classIds = classes.map(cls => cls._id);
      
      // Find all sessions for these classes 
      const sessions = await Session.find({ classId: { $in: classIds } });
      
      if (sessions.length === 0) {
        return res.status(404).json({ message: 'No sessions found for your classes' });
      }
      
      const sessionIds = sessions.map(session => session._id);
      
      // Get attendance records for all sessions
      const attendanceRecords = await AttendanceRecord.find({
        session: { $in: sessionIds }
      });
      
      // Group by class
      const summary = [];
      for (const cls of classes) {
        const classId = cls._id.toString();
        const classSessions = sessions.filter(session => 
          session.classId.toString() === classId
        );
        
        if (classSessions.length === 0) continue;
        
        const sessionIds = classSessions.map(session => session._id.toString());
        const classAttendance = attendanceRecords.filter(record => 
          sessionIds.includes(record.session.toString())
        );
        
        // Calculate class stats
        const totalRecords = classAttendance.length;
        const presentCount = classAttendance.filter(record => record.isPresent).length;
        const attendanceRate = totalRecords > 0 ? (presentCount / totalRecords) * 100 : 0;
        
        summary.push({
          classId: cls._id,
          className: cls.courseName,
          courseId: cls.courseId,
          sessionsCount: classSessions.length,
          lastSession: classSessions.sort((a, b) => b.date - a.date)[0]?.date || null,
          attendanceRate: attendanceRate.toFixed(2) + '%'
        });
      }
      
      res.status(200).json({
        message: 'Attendance summary retrieved successfully',
        summary
      });
      
    } catch (error) {
      console.error('Error retrieving teacher attendance summary:', error);
      res.status(500).json({ 
        message: 'Failed to retrieve attendance summary', 
        error: error.message 
      });
    }
  };