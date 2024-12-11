//controllers\StudentController\studentController.js

const { validationResult } = require('express-validator');
const AttendanceRecord = require('../../models/attendanceRecord');
const { storeAttendanceRecord } = require('../../services/solanaService');
const Wallet = require('../../models/wallet');
const anchor = require('@project-serum/anchor');
const { PublicKey } = require('@solana/web3.js');
const { getAttendanceRecord } = require('../../services/solanaService');
const teacher = require('../../models/teacher');
const student = require('../../models/student');
const _class = require('../../models/class');


exports.markAttendance = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { sessionId } = req.body;
  const studentId = req.user.id; // Assuming student is marking their own attendance

  try {
    // Retrieve the student's wallet
    const studentWallet = await Wallet.findOne({ email: req.user.email });
    if (!studentWallet) {
      return res.status(404).json({ msg: 'Student wallet not found' });
    }

    // Load the student's keypair
    const secretKey = Uint8Array.from(studentWallet.secretKey);
    const studentKeypair = anchor.web3.Keypair.fromSecretKey(secretKey);

    const attendanceRecord = await AttendanceRecord.findOne({ session: sessionId, student: studentId });
    if (!attendanceRecord) {
      return res.status(404).json({ msg: 'Attendance record not found' });
    }

    attendanceRecord.isPresent = true;
    await attendanceRecord.save();

    // Submit attendance to Solana blockchain using the student's wallet
    const publicKey = await storeAttendanceRecord(studentId, sessionId, true, studentKeypair);

    res.status(200).json({ msg: 'Attendance marked successfully and submitted to blockchain', attendanceRecord, publicKey });
  } catch (err) {
    console.error('Error marking attendance:', err.message);
    res.status(500).send('Server error');
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
        let studentClasses = await _class.find({ courseName: user.courses })
        // for (const course of user.courses) {
        //   studentClasses.push(
        //   );
        // }

        return res.status(200).json({ message: "Student classes fetched.", studentClasses });
      }
      return res.status(400).json({ message: "No user found." })

    } catch (error) {
      console.log(error)
      res.status(500).json({ message: "Internal Server Error.", error })
    }
  }
  else {
    return res.status(500).json({ message: "No user id provided." })
  }
}
