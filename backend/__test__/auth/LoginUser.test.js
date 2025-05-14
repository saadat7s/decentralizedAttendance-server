// backend/__tests__/auth/loginUser.test.js

const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { loginUser } = require('../../controllers/AuthController/loginUserController');
const User = require('../../models/user');

// Mock the models and other dependencies
jest.mock('../../models/user');
jest.mock('bcryptjs');
jest.mock('jsonwebtoken');

describe('Login User Controller', () => {
  let req;
  let res;
  let next;

  beforeEach(() => {
    // Reset mocks
    jest.clearAllMocks();

    // Mock request and response
    req = {
      body: {
        email: 'test@example.com',
        password: 'password123'
      }
    };

    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    };

    next = jest.fn();
  });

  test('should return 400 if user does not exist', async () => {
    // Mock User.findOne to return null (user not found)
    User.findOne.mockResolvedValue(null);

    // Call the controller function
    await loginUser(req, res);

    // Assertions
    expect(User.findOne).toHaveBeenCalledWith({ email: 'test@example.com' });
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({ msg: 'Invalid credentials' });
  });

  test('should return 400 if password is incorrect', async () => {
    // Mock User.findOne to return a user
    const mockUser = {
      id: 'user123',
      email: 'test@example.com',
      password: 'hashedPassword',
      role: 'student'
    };
    User.findOne.mockResolvedValue(mockUser);

    // Mock bcrypt.compare to return false (incorrect password)
    bcrypt.compare.mockResolvedValue(false);

    // Call the controller function
    await loginUser(req, res);

    // Assertions
    expect(User.findOne).toHaveBeenCalledWith({ email: 'test@example.com' });
    expect(bcrypt.compare).toHaveBeenCalledWith('password123', 'hashedPassword');
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({ msg: 'Invalid credentials' });
  });

  test('should return 403 if role is not allowed', async () => {
    // Mock User.findOne to return a user with an invalid role
    const mockUser = {
      id: 'user123',
      email: 'test@example.com',
      password: 'hashedPassword',
      role: 'invalid_role'
    };
    User.findOne.mockResolvedValue(mockUser);

    // Mock bcrypt.compare to return true (correct password)
    bcrypt.compare.mockResolvedValue(true);

    // Call the controller function
    await loginUser(req, res);

    // Assertions
    expect(User.findOne).toHaveBeenCalledWith({ email: 'test@example.com' });
    expect(bcrypt.compare).toHaveBeenCalledWith('password123', 'hashedPassword');
    expect(res.status).toHaveBeenCalledWith(403);
    expect(res.json).toHaveBeenCalledWith({ msg: 'Unauthorized role' });
  });

  test('should return token for successful login', async () => {
    // Mock environment variable
    process.env.JWT_SECRET = 'testsecret';

    // Mock User.findOne to return a user
    const mockUser = {
      id: 'user123',
      email: 'test@example.com',
      password: 'hashedPassword',
      role: 'student',
      publicKey: 'public_key_123'
    };
    User.findOne.mockResolvedValue(mockUser);

    // Mock bcrypt.compare to return true (correct password)
    bcrypt.compare.mockResolvedValue(true);

    // Mock jwt.sign to synchronously return a token
    jwt.sign.mockImplementation((payload, secret, options, callback) => {
      callback(null, 'mock_token');
    });

    // Call the controller function
    await loginUser(req, res);

    // Assertions
    expect(User.findOne).toHaveBeenCalledWith({ email: 'test@example.com' });
    expect(bcrypt.compare).toHaveBeenCalledWith('password123', 'hashedPassword');
    
    // Check that jwt.sign was called with the correct payload
    expect(jwt.sign).toHaveBeenCalled();
    expect(jwt.sign.mock.calls[0][0]).toEqual({
      user: {
        id: 'user123',
        role: 'student',
        email: 'test@example.com'
      }
    });
    
    expect(res.json).toHaveBeenCalledWith({
      msg: 'Login successful for student',
      role: 'student',
      token: 'mock_token',
      publicKey: 'public_key_123'
    });
  });

  test('should handle server errors', async () => {
    // Mock User.findOne to throw an error
    const error = new Error('Database error');
    User.findOne.mockRejectedValue(error);

    // Spy on console.error
    jest.spyOn(console, 'error').mockImplementation(() => {});

    // Call the controller function
    await loginUser(req, res);

    // Assertions
    expect(console.error).toHaveBeenCalledWith(error.message);
    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.send).toHaveBeenCalledWith('Server error');

    // Restore console.error
    console.error.mockRestore();
  });
});