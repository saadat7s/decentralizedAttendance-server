const express = require('express');
const { check } = require('express-validator');
const auth = require('../../middlewares/authMiddleware');
const { markAttendance } = require('../../controllers/StudentController/markAttendanceController');

const router = express.Router();

// Mark attendance route
router.post(
    '/',
    [
        check('sessionId', 'Session ID is required').not().isEmpty()
    ],
    auth,
    markAttendance
);

module.exports = router;
