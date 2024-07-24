// routes/AdminRoutes/createClass.js

const express = require('express');
const { check } = require('express-validator');
const { createClass } = require('../../controllers/AdminController/createClassController');
const auth = require('../../middlewares/authMiddleware');
const adminAuth = require('../../middlewares/adminAuthMiddleware');

const router = express.Router();

// Create class route
router.post(
    '/',
    [
        check('courseName', 'Course name is required').not().isEmpty(),
        check('courseId', 'Course ID is required').not().isEmpty(),
        check('teacherId', 'Teacher ID is required').not().isEmpty()
    ],
    auth,
    adminAuth,
    createClass
);

module.exports = router;
