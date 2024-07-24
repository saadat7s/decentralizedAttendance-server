// routes/AdminRoutes/editClass.js

const express = require('express');
const { check } = require('express-validator');
const adminAuth = require('../../middlewares/adminAuthMiddleware');
const { editClass } = require('../../controllers/AdminController/editClassController');

const router = express.Router();

// Edit class route
router.put(
    '/',
    [
        check('classId', 'Class ID is required').not().isEmpty(),
        check('studentIds', 'Student IDs are required').isArray().not().isEmpty()
    ],
    adminAuth,
    editClass
);

module.exports = router;
