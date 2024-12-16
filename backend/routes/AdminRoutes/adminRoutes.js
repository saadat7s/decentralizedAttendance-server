// routes/adminRoutes.js

const express = require('express');
const { check } = require('express-validator');
const adminUserController = require('../../controllers/AdminController/adminUserController');
const { isAuth } = require('../../middlewares/authMiddleware');

const router = express.Router();

// Register Teacher
router.post(
  '/registerTeacher',
  [
    check('name', 'Name is required').not().isEmpty(),
    check('email', 'Please include a valid email').isEmail(),
    check('password', 'Password must be at least 6 characters long').isLength({ min: 6 }),
    check('faculty', 'Faculty is required').not().isEmpty(),
    check('designation', 'Designation is required').not().isEmpty()
  ],
  isAuth,
  adminUserController.registerTeacher
);

// Register Student
router.post(
  '/registerStudent',
  [
    check('name', 'Name is required').not().isEmpty(),
    check('email', 'Please include a valid email').isEmail(),
    check('password', 'Password must be at least 6 characters long').isLength({ min: 6 }),
    check('rollNumber', 'Roll number is required').not().isEmpty(),
    check('department', 'Department is required').not().isEmpty(),
    check('semester', 'Semester is required').isInt(),
    check('program', 'Program is required').not().isEmpty(),
    check('admissionYear', 'Admission year is required').isInt(),
    check('batch', 'Batch is required').not().isEmpty()
  ],
  isAuth,
  adminUserController.registerStudent
);

// Create and Assign Class
router.post(
  '/createClass',
  [
    check('courseName', 'Course name is required').not().isEmpty(),
    check('courseId', 'Course ID is required').not().isEmpty(),
    check('teacherId', 'Teacher ID is required').not().isEmpty(),
    check('studentIds', 'Student IDs are required and should be an array').isArray().not().isEmpty()
  ],
  isAuth,
  adminUserController.createAndAssignClass
);

// Edit Class
router.put(
  '/editClass',
  [
    check('classId', 'Class ID is required').not().isEmpty(),
    check('courseName', 'Course Name is required').optional().not().isEmpty(),
    check('courseId', 'Course ID is required').optional().not().isEmpty(),
    check('teacherId', 'Teacher ID must be a valid ID').optional().isMongoId(),
    check('studentIds', 'Student IDs must be an array').optional().isArray()
  ],
  isAuth,
  adminUserController.editClass
);

// Create Session Route
router.post(
  '/create-session',
  [
      check('classId', 'Class ID is required').notEmpty(),
      check('name', 'Session name is required').notEmpty(),
      check('date', 'Session date is required').isISO8601(),
  ],
  isAuth,
  adminUserController.createSession
);

// Route to get all sessions
router.get('/get-all-sessions', isAuth, adminUserController.getAllSessions);

// Retrieve List of Teachers
router.get('/getAllTeachers', isAuth, adminUserController.getAllTeachers);

// Retrieve List of Students
router.get('/getAllStudents', isAuth, adminUserController.getAllStudents);

// Retrieve Information for a Specific Teacher
router.get('/getTeacherById/:id', isAuth, adminUserController.getTeacherById);

// Retrieve Information for a Specific Student
router.get('/getStudentById/:id', isAuth, adminUserController.getStudentById);

router.get('/get-all-classes', isAuth, adminUserController.getAllClasses)

module.exports = router;
