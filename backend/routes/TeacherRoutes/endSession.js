const express = require('express');
const { check } = require('express-validator');
const auth = require('../../middlewares/authMiddleware');
const { endSession } = require('../../controllers/TeacherController/endSessionController');

const router = express.Router();

// End session route
router.post(
    '/',
    [
        check('sessionId', 'Session ID is required').not().isEmpty()
    ],
    auth,
    endSession
);

module.exports = router;
