// backend/__tests__/teacherController.test.js

const { validationResult } = require('express-validator');
const Session = require('../../models/session');
const Class = require('../../models/class');
const AttendanceRecord = require('../../models/attendanceRecord');
const { startSession, endSession, selectClass, markAttendance } = require('../../controllers/TeacherController/teacherController');

// Mock dependencies
jest.mock('express-validator');
jest.mock('../../models/session');
jest.mock('../../models/class');
jest.mock('../../models/attendanceRecord');

describe('Teacher Controller', () => {
  let req;
  let res;

  beforeEach(() => {
    // Reset mocks
    jest.clearAllMocks();

    // Mock request and response
    req = {
      params: {},
      body: {},
      user: {
        id: 'teacher_id'
      }
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

  describe('startSession', () => {
    beforeEach(() => {
      // Set request body
      req.body = {
        name: 'Session 1',
        startTime: '2025-01-01T09:00:00Z',
        endTime: '2025-01-01T10:00:00Z',
        classId: 'class_id'
      };

      // Mock Class.findById
      const mockClass = {
        _id: 'class_id',
        teacher: 'teacher_id',
        students: [
          { _id: 'student1_id' },
          { _id: 'student2_id' }
        ],
        populate: jest.fn().mockResolvedThis()
      };
      Class.findById = jest.fn().mockResolvedValue(mockClass);

      // Mock Session.findOne (no overlapping sessions)
      Session.findOne = jest.fn().mockResolvedValue(null);

      // Mock Session constructor and save
      const mockSession = {
        _id: 'session_id',
        ...req.body,
        save: jest.fn().mockResolvedValue(true)
      };
      Session.mockReturnValue(mockSession);

      // Mock AttendanceRecord.insertMany
      AttendanceRecord.insertMany = jest.fn().mockResolvedValue([]);
    });

    test('should start a session successfully', async () => {
      // Call the controller function
      await startSession(req, res);

      // Assertions
      expect(validationResult).toHaveBeenCalledWith(req);
      expect(Class.findById).toHaveBeenCalledWith('class_id');
      
      // Check for overlapping sessions
      expect(Session.findOne).toHaveBeenCalledWith({
        class: 'class_id',
        $or: [
          { startTime: { $lt: req.body.endTime, $gte: req.body.startTime } },
          { endTime: { $gt: req.body.startTime, $lte: req.body.endTime } }
        ]
      });
      
      // Check Session creation
      expect(Session).toHaveBeenCalledWith({
        name: 'Session 1',
        startTime: '2025-01-01T09:00:00Z',
        endTime: '2025-01-01T10:00:00Z',
        class: 'class_id',
        teacher: 'teacher_id',
        students: expect.any(Array)
      });
      
      // Check AttendanceRecord creation
      expect(AttendanceRecord.insertMany).toHaveBeenCalledWith([
        {
          session: 'session_id',
          student: 'student1_id',
          markedBy: 'teacher_id',
          isPresent: false
        },
        {
          session: 'session_id',
          student: 'student2_id',
          markedBy: 'teacher_id',
          isPresent: false
        }
      ]);
      
      // Check response
      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith({
        msg: 'Session started successfully',
        session: expect.any(Object),
        attendanceRecords: expect.any(Array)
      });
    });

    test('should return 400 for validation errors', async () => {
      // Mock validation error
      validationResult.mockReturnValue({
        isEmpty: jest.fn().mockReturnValue(false),
        array: jest.fn().mockReturnValue([{ msg: 'Start time is required' }])
      });

      // Call the controller function
      await startSession(req, res);

      // Assertions
      expect(validationResult).toHaveBeenCalledWith(req);
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ errors: [{ msg: 'Start time is required' }] });
    });

    test('should return 404 if class not found', async () => {
      // Mock Class.findById to return null
      Class.findById = jest.fn().mockResolvedValue(null);

      // Call the controller function
      await startSession(req, res);

      // Assertions
      expect(Class.findById).toHaveBeenCalledWith('class_id');
      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({ msg: 'Class not found' });
    });

    test('should return 400 if class has no teacher', async () => {
      // Mock Class.findById to return a class without a teacher
      const mockClass = {
        _id: 'class_id',
        teacher: null,
        students: [],
        populate: jest.fn().mockResolvedThis()
      };
      Class.findById = jest.fn().mockResolvedValue(mockClass);

      // Call the controller function
      await startSession(req, res);

      // Assertions
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ msg: 'Class does not have an assigned teacher' });
    });

    test('should return 400 if overlapping session exists', async () => {
      // Mock Session.findOne to return an overlapping session
      Session.findOne = jest.fn().mockResolvedValue({
        _id: 'existing_session_id',
        name: 'Existing Session'
      });

      // Call the controller function
      await startSession(req, res);

      // Assertions
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ msg: 'Overlapping session already exists' });
    });

    test('should handle errors', async () => {
      // Mock Class.findById to throw an error
      Class.findById = jest.fn().mockRejectedValue(new Error('Database error'));

      // Spy on console.error
      jest.spyOn(console, 'error').mockImplementation(() => {});

      // Call the controller function
      await startSession(req, res);

      // Assertions
      expect(console.error).toHaveBeenCalledWith('Error starting session:', 'Database error');
      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.send).toHaveBeenCalledWith('Server error');

      // Restore console.error
      console.error.mockRestore();
    });
  });

  describe('endSession', () => {
    beforeEach(() => {
      // Set request body
      req.body = {
        sessionId: 'session_id'
      };

      // Mock Session.findById
      const mockSession = {
        _id: 'session_id',
        teacher: 'teacher_id',
        isCompleted: false,
        save: jest.fn().mockResolvedValue(true)
      };
      Session.findById = jest.fn().mockResolvedValue(mockSession);
    });

    test('should end a session successfully', async () => {
      // Call the controller function
      await endSession(req, res);

      // Assertions
      expect(Session.findById).toHaveBeenCalledWith('session_id');
      
      // Check session update
      const session = await Session.findById();
      expect(session.isCompleted).toBe(true);
      expect(session.save).toHaveBeenCalled();
      
      // Check response
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        msg: 'Session ended successfully',
        session: expect.any(Object)
      });
    });

    test('should return 404 if session not found', async () => {
      // Mock Session.findById to return null
      Session.findById = jest.fn().mockResolvedValue(null);

      // Call the controller function
      await endSession(req, res);

      // Assertions
      expect(Session.findById).toHaveBeenCalledWith('session_id');
      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({ msg: 'Session not found' });
    });

    test('should return 403 if teacher not authorized', async () => {
      // Mock Session.findById to return a session with different teacher
      const mockSession = {
        _id: 'session_id',
        teacher: 'different_teacher_id', // Different from req.user.id
        isCompleted: false
      };
      Session.findById = jest.fn().mockResolvedValue(mockSession);

      // Call the controller function
      await endSession(req, res);

      // Assertions
      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith({ msg: 'You are not authorized to end this session' });
    });

    test('should handle errors', async () => {
      // Mock Session.findById to throw an error
      Session.findById = jest.fn().mockRejectedValue(new Error('Database error'));

      // Spy on console.error
      jest.spyOn(console, 'error').mockImplementation(() => {});

      // Call the controller function
      await endSession(req, res);

      // Assertions
      expect(console.error).toHaveBeenCalledWith('Database error');
      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.send).toHaveBeenCalledWith('Server error');

      // Restore console.error
      console.error.mockRestore();
    });
  });

  describe('selectClass', () => {
    test('should return classes assigned to a teacher', async () => {
      // Mock Class.find
      const mockClasses = [
        { _id: 'class1_id', name: 'Class 1' },
        { _id: 'class2_id', name: 'Class 2' }
      ];
      Class.find = jest.fn().mockReturnValue({
        populate: jest.fn().mockResolvedValue(mockClasses)
      });

      // Call the controller function
      await selectClass(req, res);

      // Assertions
      expect(Class.find).toHaveBeenCalledWith({ teacher: 'teacher_id' });
      expect(res.json).toHaveBeenCalledWith(mockClasses);
    });

    test('should handle errors', async () => {
      // Mock Class.find to throw an error
      Class.find = jest.fn().mockImplementation(() => {
        throw new Error('Database error');
      });

      // Spy on console.error
      jest.spyOn(console, 'error').mockImplementation(() => {});

      // Call the controller function
      await selectClass(req, res);

      // Assertions
      expect(console.error).toHaveBeenCalledWith('Database error');
      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.send).toHaveBeenCalledWith('Server error');

      // Restore console.error
      console.error.mockRestore();
    });
  });

  describe('markAttendance', () => {
    beforeEach(() => {
      // Set request body
      req.body = {
        sessionId: 'session_id',
        studentId: 'student_id'
      };

      // Mock validation result
      validationResult.mockReturnValue({
        isEmpty: jest.fn().mockReturnValue(true),
        array: jest.fn().mockReturnValue([])
      });

      // Mock Session.findById
      const mockSession = {
        _id: 'session_id',
        teacher: 'teacher_id'
      };
      Session.findById = jest.fn().mockResolvedValue(mockSession);

      // Mock Attendance creation
      const mockAttendance = {
        save: jest.fn().mockResolvedValue(true)
      };
      AttendanceRecord.mockReturnValue(mockAttendance);
    });

    test('should mark attendance successfully', async () => {
      // Call the controller function
      await markAttendance(req, res);

      // Assertions
      expect(validationResult).toHaveBeenCalledWith(req);
      expect(Session.findById).toHaveBeenCalledWith('session_id');
      
      // Check Attendance creation
      expect(AttendanceRecord).toHaveBeenCalledWith({
        session: 'session_id',
        student: 'student_id',
        markedBy: 'teacher_id'
      });
      
      const attendance = AttendanceRecord();
      expect(attendance.save).toHaveBeenCalled();
      
      // Check response
      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith({
        msg: 'Attendance marked successfully',
        attendance: expect.any(Object)
      });
    });

    test('should return 400 for validation errors', async () => {
      // Mock validation error
      validationResult.mockReturnValue({
        isEmpty: jest.fn().mockReturnValue(false),
        array: jest.fn().mockReturnValue([{ msg: 'Session ID is required' }])
      });

      // Call the controller function
      await markAttendance(req, res);

      // Assertions
      expect(validationResult).toHaveBeenCalledWith(req);
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ errors: [{ msg: 'Session ID is required' }] });
    });

    test('should return 404 if session not found', async () => {
      // Mock Session.findById to return null
      Session.findById = jest.fn().mockResolvedValue(null);

      // Call the controller function
      await markAttendance(req, res);

      // Assertions
      expect(Session.findById).toHaveBeenCalledWith('session_id');
      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({ msg: 'Session not found' });
    });

    test('should return 403 if teacher not authorized', async () => {
      // Mock Session.findById to return a session with different teacher
      const mockSession = {
        _id: 'session_id',
        teacher: 'different_teacher_id' // Different from req.user.id
      };
      Session.findById = jest.fn().mockResolvedValue(mockSession);

      // Call the controller function
      await markAttendance(req, res);

      // Assertions
      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith({ msg: 'You are not authorized to mark attendance for this session' });
    });

    test('should handle errors', async () => {
      // Mock Session.findById to throw an error
      Session.findById = jest.fn().mockRejectedValue(new Error('Database error'));

      // Spy on console.error
      jest.spyOn(console, 'error').mockImplementation(() => {});

      // Call the controller function
      await markAttendance(req, res);

      // Assertions
      expect(console.error).toHaveBeenCalledWith('Database error');
      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.send).toHaveBeenCalledWith('Server error');

      // Restore console.error
      console.error.mockRestore();
    });
  });
});