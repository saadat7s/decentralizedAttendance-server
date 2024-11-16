// routes/adminRoutes.js

const express = require('express');
const { check } = require('express-validator');
const adminAuth = require('../../middlewares/adminAuthMiddleware');
const adminUserController = require('../../controllers/AdminController/adminUserController');

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
  adminAuth,
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
  adminAuth,
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
  adminAuth,
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
  adminAuth,
  adminUserController.editClass
);

// Retrieve List of Teachers
router.get('/getAllTeachers', adminAuth, adminUserController.getAllTeachers);

// Retrieve List of Students
router.get('/getAllStudents', adminAuth, adminUserController.getAllStudents);

// Retrieve Information for a Specific Teacher
router.get('/getTeacherById/:id', adminAuth, adminUserController.getTeacherById);

// Retrieve Information for a Specific Student
router.get('/getStudentById/:id', adminAuth, adminUserController.getStudentById);

module.exports = router;
