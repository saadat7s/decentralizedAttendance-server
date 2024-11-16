// routes\TeacherRoutes\teacherRoutes.js

const express = require('express');
const { check } = require('express-validator');
const auth = require('../../middlewares/authMiddleware');
const { startSession, selectClass, markAttendance, endSession  } = require('../../controllers/TeacherController/teacherController');

const router = express.Router();

// End session route
router.post(
    '/endSession',
    [
        check('sessionId', 'Session ID is required').not().isEmpty()
    ],
    auth,
    endSession
);

// Finalize attendance route
router.post(
    '/finalizeAttendance',
    [
        check('sessionId', 'Session ID is required').not().isEmpty(),
        check('studentId', 'Student ID is required').not().isEmpty()
    ],
    auth,
    markAttendance
);

// Select class route
router.get('/selectClass', auth, selectClass);

// Start session route
router.post(
    '/startSession',
    [
        check('name', 'Session name is required').not().isEmpty(),
        check('startTime', 'Start time is required').not().isEmpty(),
        check('endTime', 'End time is required').not().isEmpty(),
        check('classId', 'Class ID is required').not().isEmpty()
    ],
    auth,
    startSession
);


module.exports = router;
