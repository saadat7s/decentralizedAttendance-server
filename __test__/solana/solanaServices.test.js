
// backend/__tests__/solana/solanaService.test.js


require('../mocks/solana-mocks');
const fs = require('fs');
const { storeAttendanceRecord, getAttendanceRecord } = require('../../services/solanaService');

// Mock dependencies
jest.mock('@project-serum/anchor');
jest.mock('@solana/web3.js');
jest.mock('fs');
jest.mock('dotenv', () => ({
  config: jest.fn()
}));

describe('Solana Service', () => {
  beforeEach(() => {
    // Reset mocks
    jest.clearAllMocks();

    // Mock environment variable
    process.env.ANCHOR_WALLET = 'path/to/wallet.json';
    process.env.ANCHOR_PROVIDER_URL = 'https://api.devnet.solana.com';

    // Mock fs.readFileSync
    fs.readFileSync.mockReturnValue(JSON.stringify([1, 2, 3, 4]));

    // Mock PublicKey
    PublicKey.mockImplementation((value) => ({
      toString: () => value
    }));

    // Mock Connection
    Connection.mockImplementation(() => ({}));

    // Mock Keypair
    const mockKeypair = {
      publicKey: {
        toString: () => 'mock_public_key'
      }
    };
    Keypair.fromSecretKey.mockReturnValue(mockKeypair);

    // Mock anchor.web3.Keypair
    anchor.web3.Keypair = {
      fromSecretKey: jest.fn().mockReturnValue(mockKeypair),
      generate: jest.fn().mockReturnValue({
        publicKey: {
          toString: () => 'generated_public_key'
        }
      })
    };

    // Mock anchor.AnchorProvider
    anchor.AnchorProvider.mockImplementation(() => ({}));

    // Mock anchor.Wallet
    anchor.Wallet = jest.fn().mockImplementation(() => ({}));

    // Mock anchor.Program
    const mockProgram = {
      methods: {
        storeAttendance: jest.fn().mockReturnValue({
          accounts: jest.fn().mockReturnValue({
            signers: jest.fn().mockReturnValue({
              rpc: jest.fn().mockResolvedValue('transaction_signature')
            })
          })
        })
      },
      account: {
        attendanceRecord: {
          coder: {
            accounts: {
              decode: jest.fn().mockReturnValue({
                studentId: 'student_id',
                sessionId: 'session_id',
                isPresent: true,
                timestamp: Date.now()
              })
            }
          }
        }
      }
    };
    anchor.Program.mockReturnValue(mockProgram);

    // Mock anchor.setProvider
    anchor.setProvider = jest.fn();

    // Mock SystemProgram
    anchor.web3.SystemProgram = {
      programId: 'system_program_id'
    };
  });

  describe('storeAttendanceRecord', () => {
    test('should store attendance record on blockchain successfully', async () => {
      // Mock data
      const studentId = 'student_id';
      const sessionId = 'session_id';
      const isPresent = true;
      const studentKeypair = {
        publicKey: {
          toString: () => 'student_public_key'
        }
      };

      // Call the function
      const result = await storeAttendanceRecord(studentId, sessionId, isPresent, studentKeypair);

      // Assertions
      expect(anchor.web3.Keypair.generate).toHaveBeenCalled();
      
      // Check program methods called correctly
      const program = anchor.Program();
      expect(program.methods.storeAttendance).toHaveBeenCalledWith(studentId, sessionId, isPresent);
      
      const accounts = program.methods.storeAttendance().accounts;
      expect(accounts).toHaveBeenCalledWith({
        attendance: expect.any(Object),
        user: studentKeypair.publicKey,
        systemProgram: anchor.web3.SystemProgram.programId
      });
      
      const signers = accounts().signers;
      expect(signers).toHaveBeenCalledWith([expect.any(Object), studentKeypair]);
      
      expect(signers().rpc).toHaveBeenCalled();
      
      // Check return value
      expect(result).toBeDefined();
      expect(result.toString()).toBe('generated_public_key');
    });

    test('should handle errors when storing attendance record', async () => {
      // Mock data
      const studentId = 'student_id';
      const sessionId = 'session_id';
      const isPresent = true;
      const studentKeypair = {
        publicKey: {
          toString: () => 'student_public_key'
        }
      };

      // Mock rpc to throw an error
      const mockProgram = {
        methods: {
          storeAttendance: jest.fn().mockReturnValue({
            accounts: jest.fn().mockReturnValue({
              signers: jest.fn().mockReturnValue({
                rpc: jest.fn().mockRejectedValue(new Error('Blockchain error'))
              })
            })
          })
        }
      };
      anchor.Program.mockReturnValue(mockProgram);

      // Spy on console.error
      jest.spyOn(console, 'error').mockImplementation(() => {});

      // Call the function and expect it to throw
      await expect(storeAttendanceRecord(studentId, sessionId, isPresent, studentKeypair))
        .rejects.toThrow('Blockchain error');

      // Assertions
      expect(console.error).toHaveBeenCalledWith('Error storing attendance record:', expect.any(Error));

      // Restore console.error
      console.error.mockRestore();
    });
  });

  describe('getAttendanceRecord', () => {
    test('should retrieve attendance record from blockchain successfully', async () => {
      // Mock data
      const publicKey = {
        toString: () => 'record_public_key'
      };

      // Mock provider connection
      const mockProvider = {
        connection: {
          getAccountInfo: jest.fn().mockResolvedValue({
            data: new Uint8Array([1, 2, 3, 4])
          })
        }
      };
      anchor.AnchorProvider.mockReturnValue(mockProvider);

      // Call the function
      const result = await getAttendanceRecord(publicKey);

      // Assertions
      expect(mockProvider.connection.getAccountInfo).toHaveBeenCalledWith(publicKey);
      expect(anchor.Program().account.attendanceRecord.coder.accounts.decode)
        .toHaveBeenCalledWith('AttendanceRecord', new Uint8Array([1, 2, 3, 4]));
      
      // Check return value
      expect(result).toEqual({
        studentId: 'student_id',
        sessionId: 'session_id',
        isPresent: true,
        timestamp: expect.any(Number)
      });
    });

    test('should handle error when account not found', async () => {
      // Mock data
      const publicKey = {
        toString: () => 'record_public_key'
      };

      // Mock provider connection to return null (account not found)
      const mockProvider = {
        connection: {
          getAccountInfo: jest.fn().mockResolvedValue(null)
        }
      };
      anchor.AnchorProvider.mockReturnValue(mockProvider);

      // Spy on console.error
      jest.spyOn(console, 'error').mockImplementation(() => {});

      // Call the function and expect it to throw
      await expect(getAttendanceRecord(publicKey))
        .rejects.toThrow('Attendance record not found');

      // Assertions
      expect(mockProvider.connection.getAccountInfo).toHaveBeenCalledWith(publicKey);
      expect(console.error).toHaveBeenCalledWith('Error fetching attendance record:', expect.any(Error));

      // Restore console.error
      console.error.mockRestore();
    });

    test('should handle general errors', async () => {
      // Mock data
      const publicKey = {
        toString: () => 'record_public_key'
      };

      // Mock provider connection to throw an error
      const mockProvider = {
        connection: {
          getAccountInfo: jest.fn().mockRejectedValue(new Error('Network error'))
        }
      };
      anchor.AnchorProvider.mockReturnValue(mockProvider);

      // Spy on console.error
      jest.spyOn(console, 'error').mockImplementation(() => {});

      // Call the function and expect it to throw
      await expect(getAttendanceRecord(publicKey))
        .rejects.toThrow('Network error');

      // Assertions
      expect(mockProvider.connection.getAccountInfo).toHaveBeenCalledWith(publicKey);
      expect(console.error).toHaveBeenCalledWith('Error fetching attendance record:', expect.any(Error));

      // Restore console.error
      console.error.mockRestore();
    });
  });
});