//routes\StudentRoutes\studentRoutes.js


const express = require('express');
const { getAttendance, markAttendance, getStudentClasses } = require('../../controllers/StudentController/studentController');
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

router.get('/classes', isAuth, getStudentClasses)

module.exports = router;
