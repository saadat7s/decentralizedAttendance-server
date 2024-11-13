//routes\StudentRoutes\studentRoutes.js


const express = require('express');
const { getAttendance, markAttendance } = require('../../controllers/StudentController/studentController');
const { check } = require('express-validator');
const auth = require('../../middlewares/authMiddleware');

const router = express.Router();

router.get('/getAttendance/:publicKey', getAttendance);

router.post(
  '/markAttendance',
  [
    check('sessionId', 'Session ID is required').not().isEmpty()
  ],
  auth,
  markAttendance
);

module.exports = router;
