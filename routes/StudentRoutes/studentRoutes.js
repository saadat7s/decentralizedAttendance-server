//routes\StudentRoutes\studentRoutes.js


const express = require('express');
const { getAttendance, markAttendance, getStudentClasses, getStudentClassAttendance, getStudentAttendance} = require('../../controllers/StudentController/studentController');
const { check } = require('express-validator');
const { isAuth } = require('../../middlewares/authMiddleware');


const router = express.Router();

router.get('/getAttendance/:publicKey', getAttendance);

router.post(
  '/markAttendance',
  [
    check('sessionId', 'Session ID is required').not().isEmpty()
  ],
  isAuth,
  markAttendance
);

// Get all attendance records for the logged in student
router.get('/attendance', isAuth, getStudentAttendance);

// Get attendance for a specific class
router.get('/attendance/class/:classId', isAuth, getStudentClassAttendance);

router.get('/classes', isAuth, getStudentClasses)

module.exports = router;
