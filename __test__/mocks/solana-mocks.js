// __test__/mocks/solana-mocks.js

// Mock the @solana/web3.js module
jest.mock('@solana/web3.js', () => {
  const mockPublicKey = {
    toString: jest.fn().mockReturnValue('mock-public-key')
  };

  const mockKeypair = {
    publicKey: mockPublicKey,
    secretKey: new Uint8Array([1, 2, 3, 4]),
  };

  return {
    Connection: jest.fn().mockImplementation(() => ({
      getBalance: jest.fn().mockResolvedValue(1000),
      getAccountInfo: jest.fn().mockResolvedValue({
        data: new Uint8Array([1, 2, 3, 4])
      })
    })),
    PublicKey: jest.fn().mockImplementation(() => mockPublicKey),
    Keypair: {
      generate: jest.fn().mockReturnValue(mockKeypair),
      fromSecretKey: jest.fn().mockReturnValue(mockKeypair)
    },
    SystemProgram: {
      programId: 'system-program-id'
    }
  };
});

// Mock the @project-serum/anchor module
jest.mock('@project-serum/anchor', () => {
  return {
    web3: {
      Keypair: {
        generate: jest.fn().mockReturnValue({
          publicKey: {
            toString: jest.fn().mockReturnValue('generated-public-key')
          }
        }),
        fromSecretKey: jest.fn().mockReturnValue({
          publicKey: {
            toString: jest.fn().mockReturnValue('keypair-public-key')
          }
        })
      },
      SystemProgram: {
        programId: 'system-program-id'
      }
    },
    Program: jest.fn().mockImplementation(() => ({
      methods: {
        storeAttendance: jest.fn().mockReturnValue({
          accounts: jest.fn().mockReturnValue({
            signers: jest.fn().mockReturnValue({
              rpc: jest.fn().mockResolvedValue('transaction-id')
            })
          })
        })
      },
      account: {
        attendanceRecord: {
          coder: {
            accounts: {
              decode: jest.fn().mockReturnValue({
                studentId: 'student-id',
                sessionId: 'session-id',
                isPresent: true,
                timestamp: Date.now()
              })
            }
          }
        }
      }
    })),
    BN: jest.fn().mockImplementation((value) => value),
    AnchorProvider: jest.fn().mockImplementation(() => ({
      connection: {
        getAccountInfo: jest.fn().mockResolvedValue({
          data: new Uint8Array([1, 2, 3, 4])
        })
      }
    })),
    Wallet: jest.fn().mockImplementation(() => ({})),
    setProvider: jest.fn()
  };
});