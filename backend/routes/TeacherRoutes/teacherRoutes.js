// routes\TeacherRoutes\teacherRoutes.js

const express = require('express');
const { check } = require('express-validator');
const { getAssignedClasses, getStudentsByClass, getSessionByClass, startSessionById, finalizeAttendance } = require('../../controllers/TeacherController/teacherController');
const { isAuth } = require('../../middlewares/authMiddleware');
const { storeAttendanceRecord } = require('../../services/solanaService');

const router = express.Router();



// getAssignedClasses
router.get('/get-assigned-classes', isAuth, getAssignedClasses);

// getStudentsByClass
router.get('/get-students-by-class/:classId', isAuth, getStudentsByClass);

// getSessionsByClass
router.get('/get-sessions-by-class/:classId', isAuth, getSessionByClass);

// start session automatically
router.post('/start-session-upon-selection/:sessionId', isAuth, startSessionById);

// finalize attendance
router.patch('/finalize-attendance', isAuth, finalizeAttendance)

// broadcast Attendance
router.post('/store-attendance', isAuth, storeAttendanceRecord)




module.exports = router;
