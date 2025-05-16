// backend/__tests__/student/studentController.test.js

const { validationResult } = require('express-validator');
const AttendanceRecord = require('../../models/attendanceRecord');
const Wallet = require('../../models/wallet');
require('../mocks/solana-mocks');
const solanaService = require('../../services/solanaService');
const { markAttendance, getAttendance } = require('../../controllers/StudentController/studentController');

// Mock dependencies
jest.mock('express-validator');
jest.mock('../../models/attendanceRecord');
jest.mock('../../models/wallet');
jest.mock('@project-serum/anchor');
jest.mock('@solana/web3.js');
jest.mock('../../services/solanaService');

describe('Student Controller', () => {
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
        id: 'student_id',
        email: 'student@example.com'
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

  describe('markAttendance', () => {
    beforeEach(() => {
      // Set request body
      req.body = {
        sessionId: 'session_id'
      };

      // Mock Wallet.findOne
      Wallet.findOne.mockResolvedValue({
        email: 'student@example.com',
        secretKey: [1, 2, 3, 4]
      });

      // Mock AttendanceRecord.findOne
      AttendanceRecord.findOne.mockResolvedValue({
        session: 'session_id',
        student: 'student_id',
        isPresent: false,
        save: jest.fn().mockResolvedValue(true)
      });

      // Mock anchor.web3.Keypair.fromSecretKey
      anchor.web3.Keypair.fromSecretKey = jest.fn().mockReturnValue({
        publicKey: 'student_keypair_public_key'
      });

      // Mock solanaService.storeAttendanceRecord
      solanaService.storeAttendanceRecord.mockResolvedValue({
        toString: () => 'transaction_public_key'
      });
    });

    test('should mark attendance successfully', async () => {
      // Call the controller function
      await markAttendance(req, res);

      // Assertions
      expect(validationResult).toHaveBeenCalledWith(req);
      expect(Wallet.findOne).toHaveBeenCalledWith({ email: 'student@example.com' });
      expect(anchor.web3.Keypair.fromSecretKey).toHaveBeenCalledWith(Uint8Array.from([1, 2, 3, 4]));
      expect(AttendanceRecord.findOne).toHaveBeenCalledWith({ session: 'session_id', student: 'student_id' });
      
      // Check attendance record is updated
      const attendanceRecord = await AttendanceRecord.findOne();
      expect(attendanceRecord.isPresent).toBe(true);
      expect(attendanceRecord.save).toHaveBeenCalled();
      
      // Check blockchain transaction
      expect(solanaService.storeAttendanceRecord).toHaveBeenCalledWith(
        'student_id',
        'session_id',
        true,
        expect.any(Object)
      );
      
      // Check response
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        msg: 'Attendance marked successfully and submitted to blockchain',
        attendanceRecord: expect.any(Object),
        publicKey: expect.any(Object)
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

    test('should return 404 if student wallet not found', async () => {
      // Mock Wallet.findOne to return null
      Wallet.findOne.mockResolvedValue(null);

      // Call the controller function
      await markAttendance(req, res);

      // Assertions
      expect(Wallet.findOne).toHaveBeenCalledWith({ email: 'student@example.com' });
      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({ msg: 'Student wallet not found' });
    });

    test('should return 404 if attendance record not found', async () => {
      // Mock AttendanceRecord.findOne to return null
      AttendanceRecord.findOne.mockResolvedValue(null);

      // Call the controller function
      await markAttendance(req, res);

      // Assertions
      expect(AttendanceRecord.findOne).toHaveBeenCalledWith({ session: 'session_id', student: 'student_id' });
      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({ msg: 'Attendance record not found' });
    });

    test('should handle errors', async () => {
      // Mock AttendanceRecord.findOne to throw an error
      AttendanceRecord.findOne.mockRejectedValue(new Error('Database error'));

      // Spy on console.error
      jest.spyOn(console, 'error').mockImplementation(() => {});

      // Call the controller function
      await markAttendance(req, res);

      // Assertions
      expect(console.error).toHaveBeenCalledWith('Error marking attendance:', 'Database error');
      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.send).toHaveBeenCalledWith('Server error');

      // Restore console.error
      console.error.mockRestore();
    });
  });

  describe('getAttendance', () => {
    beforeEach(() => {
      // Set request params
      req.params = {
        publicKey: 'attendance_public_key'
      };

      // Mock PublicKey
      PublicKey.mockImplementation((value) => ({
        toString: () => value
      }));

      // Mock solanaService.getAttendanceRecord
      solanaService.getAttendanceRecord.mockResolvedValue({
        studentId: 'student_id',
        sessionId: 'session_id',
        isPresent: true,
        timestamp: Date.now()
      });
    });

    test('should retrieve attendance record successfully', async () => {
      // Call the controller function
      await getAttendance(req, res);

      // Assertions
      expect(PublicKey).toHaveBeenCalledWith('attendance_public_key');
      expect(solanaService.getAttendanceRecord).toHaveBeenCalledWith(expect.any(Object));
      
      // Check response
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        studentId: 'student_id',
        sessionId: 'session_id',
        isPresent: true,
        timestamp: expect.any(Number)
      });
    });

    test('should handle errors', async () => {
      // Mock solanaService.getAttendanceRecord to throw an error
      solanaService.getAttendanceRecord.mockRejectedValue(new Error('Blockchain error'));

      // Spy on console.error
      jest.spyOn(console, 'error').mockImplementation(() => {});

      // Call the controller function
      await getAttendance(req, res);

      // Assertions
      expect(console.error).toHaveBeenCalledWith('Error fetching attendance record:', 'Blockchain error');
      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.send).toHaveBeenCalledWith('Server error');

      // Restore console.error
      console.error.mockRestore();
    });
  });
});