// routes\TeacherRoutes\teacherRoutes.js

const express = require('express');
const { check } = require('express-validator');
const { getAssignedClasses, getStudentsByClass, getSessionByClass, startSessionById, finalizeAttendance } = require('../../controllers/TeacherController/teacherController');
const { isAuth } = require('../../middlewares/authMiddleware');
const { startSession } = require('../../models/session');

const router = express.Router();



// getAssignedClasses
router.get('/get-assigned-classes', isAuth, getAssignedClasses);

// getStudentsByClass
router.get('/get-students-by-class/:classId', isAuth, getStudentsByClass);

// getSessionsByClass
router.get('/get-sessions-by-class/:classId', isAuth, getSessionByClass);

// start session automatically
router.post('/start-session-upon-selection/:sessionId', isAuth, startSessionById);

router.patch('/finalize-attendance', isAuth, finalizeAttendance)



module.exports = router;
