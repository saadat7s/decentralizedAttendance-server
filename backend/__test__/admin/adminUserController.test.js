// backend/__tests__/admin/adminUserController.test.js

const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
require('../mocks/solana-mocks');
const { registerTeacher, registerStudent, createAndAssignClass } = require('../../controllers/AdminController/adminUserController');
const User = require('../../models/user');
const Teacher = require('../../models/teacher');
const Student = require('../../models/student');
const Class = require('../../models/class');
const Wallet = require('../../models/wallet');
const { validationResult } = require('express-validator');

// Mock dependencies
jest.mock('../../models/user');
jest.mock('../../models/teacher');
jest.mock('../../models/student');
jest.mock('../../models/class');
jest.mock('../../models/wallet');
jest.mock('@solana/web3.js');
jest.mock('bcryptjs');
jest.mock('express-validator');

describe('Admin User Controller', () => {
  let req;
  let res;

  beforeEach(() => {
    // Reset mocks
    jest.clearAllMocks();

    // Mock request and response
    req = {
      body: {}
    };

    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
      send: jest.fn()
    };

    // Mock validation result
    validationResult.mockReturnValue({
      isEmpty: jest.fn().mockReturnValue(true),
      array: jest.fn().mockReturnValue([])
    });
  });

  describe('registerTeacher', () => {
    beforeEach(() => {
      // Set request body for teacher registration
      req.body = {
        name: 'John Doe',
        email: 'teacher@example.com',
        password: 'password123',
        faculty: 'Computer Science',
        designation: 'Assistant Professor',
        officeLocation: 'Room 101'
      };

      // Mock Keypair.generate
      Keypair.generate.mockReturnValue({
        publicKey: {
          toString: jest.fn().mockReturnValue('mock_public_key')
        },
        secretKey: new Uint8Array([1, 2, 3])
      });

      // Mock bcrypt methods
      bcrypt.genSalt.mockResolvedValue('salt');
      bcrypt.hash.mockResolvedValue('hashed_password');

      // Mock User.findOne
      User.findOne.mockResolvedValue(null);

      // Mock User creation
      const mockUser = {
        _id: 'user_id',
        ...req.body,
        role: 'teacher',
        publicKey: 'mock_public_key',
        save: jest.fn().mockResolvedValue(true)
      };
      User.mockReturnValue(mockUser);

      // Mock Teacher creation
      const mockTeacher = {
        save: jest.fn().mockResolvedValue(true)
      };
      Teacher.mockReturnValue(mockTeacher);

      // Mock Wallet creation
      const mockWallet = {
        save: jest.fn().mockResolvedValue(true)
      };
      Wallet.mockReturnValue(mockWallet);
    });

    test('should return 400 if teacher already exists', async () => {
      // Mock User.findOne to find a user
      User.findOne.mockResolvedValue({ email: 'teacher@example.com' });

      // Call the controller function
      await registerTeacher(req, res);

      // Assertions
      expect(User.findOne).toHaveBeenCalledWith({ email: 'teacher@example.com' });
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ msg: 'User already exists' });
    });

    test('should create a new teacher successfully', async () => {
      // Call the controller function
      await registerTeacher(req, res);

      // Assertions
      expect(User.findOne).toHaveBeenCalledWith({ email: 'teacher@example.com' });
      expect(Keypair.generate).toHaveBeenCalled();
      expect(bcrypt.genSalt).toHaveBeenCalledWith(10);
      expect(bcrypt.hash).toHaveBeenCalledWith('password123', 'salt');
      
      // Verify User creation
      expect(User).toHaveBeenCalledWith({
        name: 'John Doe',
        email: 'teacher@example.com',
        password: 'hashed_password',
        role: 'teacher',
        publicKey: 'mock_public_key'
      });

      // Verify Wallet creation
      expect(Wallet).toHaveBeenCalledWith({
        email: 'teacher@example.com',
        publicKey: 'mock_public_key',
        secretKey: [1, 2, 3]
      });

      // Verify Teacher creation
      expect(Teacher).toHaveBeenCalledWith({
        user: 'user_id',
        faculty: 'Computer Science',
        designation: 'Assistant Professor',
        officeLocation: 'Room 101'
      });

      // Verify response
      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith({
        msg: 'Teacher registered successfully',
        teacher: expect.any(Object),
        credentials: {
          email: 'teacher@example.com',
          password: 'password123'
        }
      });
    });

    test('should handle validation errors', async () => {
      // Mock validation error
      validationResult.mockReturnValue({
        isEmpty: jest.fn().mockReturnValue(false),
        array: jest.fn().mockReturnValue([{ msg: 'Name is required' }])
      });

      // Call the controller function
      await registerTeacher(req, res);

      // Assertions
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ errors: [{ msg: 'Name is required' }] });
    });

    test('should handle server errors', async () => {
      // Mock User.save to throw an error
      const mockUser = {
        _id: 'user_id',
        ...req.body,
        role: 'teacher',
        publicKey: 'mock_public_key',
        save: jest.fn().mockRejectedValue(new Error('Failed to save user'))
      };
      User.mockReturnValue(mockUser);

      // Spy on console.error
      jest.spyOn(console, 'error').mockImplementation(() => {});

      // Call the controller function
      await registerTeacher(req, res);

      // Assertions
      expect(console.error).toHaveBeenCalledWith('Error in registering teacher:', 'Failed to save user');
      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.send).toHaveBeenCalledWith('Server error');

      // Restore console.error
      console.error.mockRestore();
    });
  });

  describe('registerStudent', () => {
    beforeEach(() => {
      // Set request body for student registration
      req.body = {
        name: 'Jane Doe',
        email: 'student@example.com',
        password: 'password123',
        rollNumber: 'CS2022-001',
        department: 'Computer Science',
        semester: 3,
        program: 'BSc',
        admissionYear: 2022,
        batch: '2022-2026'
      };

      // Mock Keypair.generate
      Keypair.generate.mockReturnValue({
        publicKey: {
          toString: jest.fn().mockReturnValue('mock_public_key')
        },
        secretKey: new Uint8Array([1, 2, 3])
      });

      // Mock bcrypt methods
      bcrypt.genSalt.mockResolvedValue('salt');
      bcrypt.hash.mockResolvedValue('hashed_password');

      // Mock User.findOne and Wallet.findOne
      User.findOne.mockResolvedValue(null);
      Wallet.findOne.mockResolvedValue(null);

      // Mock User creation
      const mockUser = {
        _id: 'user_id',
        ...req.body,
        role: 'student',
        publicKey: 'mock_public_key',
        save: jest.fn().mockResolvedValue(true)
      };
      User.mockReturnValue(mockUser);

      // Mock Student creation
      const mockStudent = {
        save: jest.fn().mockResolvedValue(true)
      };
      Student.mockReturnValue(mockStudent);

      // Mock Wallet creation
      const mockWallet = {
        save: jest.fn().mockResolvedValue(true)
      };
      Wallet.mockReturnValue(mockWallet);
    });

    test('should create a new student successfully', async () => {
      // Call the controller function
      await registerStudent(req, res);

      // Assertions
      expect(User.findOne).toHaveBeenCalledWith({ email: 'student@example.com' });
      expect(Wallet.findOne).toHaveBeenCalledWith({ email: 'student@example.com' });
      expect(Keypair.generate).toHaveBeenCalled();
      expect(bcrypt.genSalt).toHaveBeenCalledWith(10);
      expect(bcrypt.hash).toHaveBeenCalledWith('password123', 'salt');
      
      // Verify User creation
      expect(User).toHaveBeenCalledWith({
        name: 'Jane Doe',
        email: 'student@example.com',
        password: 'hashed_password',
        role: 'student',
        publicKey: 'mock_public_key'
      });

      // Verify Wallet creation
      expect(Wallet).toHaveBeenCalledWith({
        email: 'student@example.com',
        publicKey: 'mock_public_key',
        secretKey: [1, 2, 3]
      });

      // Verify Student creation
      expect(Student).toHaveBeenCalledWith({
        user: 'user_id',
        rollNumber: 'CS2022-001',
        department: 'Computer Science',
        semester: 3,
        program: 'BSc',
        admissionYear: 2022,
        batch: '2022-2026'
      });

      // Verify response
      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith({
        msg: 'Student registered successfully',
        student: expect.any(Object),
        credentials: {
          email: 'student@example.com',
          password: 'password123'
        }
      });
    });
  });

  describe('createAndAssignClass', () => {
    beforeEach(() => {
      // Set request body for class creation
      req.body = {
        courseName: 'Data Structures',
        courseId: 'CS201',
        teacherId: 'teacher_id',
        studentIds: ['student1_id', 'student2_id']
      };

      // Mock Teacher.findOne
      Teacher.findOne.mockResolvedValue({ user: 'teacher_id' });

      // Mock Class.findOne
      Class.findOne.mockResolvedValue(null);

      // Mock Student.find
      Student.find.mockResolvedValue([
        { user: 'student1_id' },
        { user: 'student2_id' }
      ]);

      // Mock Class creation
      const mockClass = {
        _id: 'class_id',
        ...req.body,
        save: jest.fn().mockResolvedValue(true)
      };
      Class.mockReturnValue(mockClass);

      // Mock User.findById
      User.findById.mockResolvedValue({ name: 'Teacher Name' });
      
      // Mock User.find
      User.find.mockResolvedValue([
        { _id: 'student1_id', name: 'Student 1' },
        { _id: 'student2_id', name: 'Student 2' }
      ]);

      // Mock console.log
      jest.spyOn(console, 'log').mockImplementation(() => {});
    });

    afterEach(() => {
      // Restore console.log
      console.log.mockRestore();
    });

    test('should create and assign a class successfully', async () => {
      // Call the controller function
      await createAndAssignClass(req, res);

      // Assertions
      expect(Teacher.findOne).toHaveBeenCalledWith({ user: 'teacher_id' });
      expect(Class.findOne).toHaveBeenCalledWith({ courseId: 'CS201' });
      expect(Student.find).toHaveBeenCalledWith({ user: { $in: ['student1_id', 'student2_id'] } });
      
      // Verify Class creation
      expect(Class).toHaveBeenCalledWith({
        courseName: 'Data Structures',
        courseId: 'CS201',
        teacher: 'teacher_id',
        students: ['student1_id', 'student2_id']
      });

      // Verify response
      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith({
        msg: 'Class created and assigned successfully',
        class: expect.any(Object)
      });
    });

    test('should return 404 if teacher is not found', async () => {
      // Mock Teacher.findOne to return null
      Teacher.findOne.mockResolvedValue(null);

      // Call the controller function
      await createAndAssignClass(req, res);

      // Assertions
      expect(Teacher.findOne).toHaveBeenCalledWith({ user: 'teacher_id' });
      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({ msg: 'Teacher not found' });
    });

    test('should return 400 if class with course ID already exists', async () => {
      // Mock Class.findOne to return a class
      Class.findOne.mockResolvedValue({ courseId: 'CS201' });

      // Call the controller function
      await createAndAssignClass(req, res);

      // Assertions
      expect(Class.findOne).toHaveBeenCalledWith({ courseId: 'CS201' });
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ msg: 'Class with this Course ID already exists' });
    });

    test('should return 400 if some student IDs are invalid', async () => {
      // Mock Student.find to return fewer students than requested
      Student.find.mockResolvedValue([{ user: 'student1_id' }]); // Only one student found

      // Call the controller function
      await createAndAssignClass(req, res);

      // Assertions
      expect(Student.find).toHaveBeenCalledWith({ user: { $in: ['student1_id', 'student2_id'] } });
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ msg: 'Some student IDs are invalid or do not exist' });
    });
  });
});