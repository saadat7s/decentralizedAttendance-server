const express = require('express');
const { check } = require('express-validator');
const auth = require('../../middlewares/authMiddleware');
const { startSession } = require('../../controllers/TeacherController/startSessionController');

const router = express.Router();

// Start session route
router.post(
    '/',
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
