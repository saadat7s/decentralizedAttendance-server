// routes\TeacherRoutes\teacherRoutes.js

const express = require('express');
const { check } = require('express-validator');
const { startSession, selectClass, markAttendance, endSession } = require('../../controllers/TeacherController/teacherController');
const { isAuth } = require('../../middlewares/authMiddleware');

const router = express.Router();

// End session route
router.post(
    '/endSession',
    [
        check('sessionId', 'Session ID is required').not().isEmpty()
    ],
    isAuth,
    endSession
);

// Finalize attendance route
router.post(
    '/finalizeAttendance',
    [
        check('sessionId', 'Session ID is required').not().isEmpty(),
        check('studentId', 'Student ID is required').not().isEmpty()
    ],
    isAuth,
    markAttendance
);

// Select class route
router.get('/selectClass', isAuth, selectClass);

// Start session route
router.post(
    '/startSession',
    [
        check('name', 'Session name is required').not().isEmpty(),
        check('startTime', 'Start time is required').not().isEmpty(),
        check('endTime', 'End time is required').not().isEmpty(),
        check('classId', 'Class ID is required').not().isEmpty()
    ],
    isAuth,
    startSession
);


module.exports = router;
