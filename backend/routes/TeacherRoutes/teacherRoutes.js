// routes\TeacherRoutes\teacherRoutes.js

const express = require('express');
const { check } = require('express-validator');
const { getAssignedClasses } = require('../../controllers/TeacherController/teacherController');
const { isAuth } = require('../../middlewares/authMiddleware');

const router = express.Router();



// Select class route
router.get('/get-assigned-classes', isAuth, getAssignedClasses);


















module.exports = router;
