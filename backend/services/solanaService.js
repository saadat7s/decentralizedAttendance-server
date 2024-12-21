
const BN = require('bn.js'); // Explicitly import BN

const anchor = require('@project-serum/anchor');
const { Connection, PublicKey, Keypair, SystemProgram } = require('@solana/web3.js');
const { AnchorProvider, Wallet } = anchor;
const fs = require('fs');
require('dotenv').config();

// Load the IDL for the program
const idl = require('../services/idl.json');
const programID = new PublicKey('7HMBCUzKs9dAxjZo1jkfe42rM66acJRcCydGZt39V5ZR');
const network = process.env.ANCHOR_PROVIDER_URL || 'https://api.devnet.solana.com';
const connection = new Connection(network, 'confirmed');

// Load wallet from environment variable (ANCHOR_WALLET) for provider initialization
const secretKey = Uint8Array.from(JSON.parse(fs.readFileSync(process.env.ANCHOR_WALLET, 'utf8')));
const wallet = anchor.web3.Keypair.fromSecretKey(secretKey);
const provider = new AnchorProvider(connection, new Wallet(wallet), { preflightCommitment: 'processed' });

anchor.setProvider(provider);

const program = new anchor.Program(idl, programID, provider);

async function storeAttendanceRecord(
  session,
  student,
  isPresent,
  isFinalized,
  teacherKeypair // Teacher's Keypair
) {
  // Generate a new keypair for the attendance account
  const attendanceAccount = anchor.web3.Keypair.generate();

  try {
    // Validate inputs before calling the program
    if (!session || !student) {
      throw new Error('Missing required parameters: session or student.');
    }

    // Convert session and student to strings (if they are ObjectId or other data types)
    const sessionId = typeof session === 'object' ? session.toString() : session;
    const studentId = typeof student === 'object' ? student.toString() : student;

    // Serialize `markedAt` timestamp to i64 (BN.js format)
    const markedAt = new BN(new Date().getTime()); // Current timestamp in milliseconds

    // Debug log for inputs
    console.log('Session ID:', sessionId);
    console.log('Student ID:', studentId);
    console.log('Is Present:', isPresent);
    console.log('Is Finalized:', isFinalized);
    console.log('Marked At (Unix Timestamp):', markedAt.toString());
    console.log('Attendance Account Public Key:', attendanceAccount.publicKey.toBase58());

    // Call the `store_attendance` function in the smart contract
    const tx = await program.methods
      .storeAttendance(
        sessionId,     // Session ID (string)
        studentId,     // Student ID (string)
        isPresent,     // Presence Status (bool)
        markedAt,      // Timestamp (BN - i64)
        isFinalized    // Finalized Status (bool)
      )
      .accounts({
        attendance: attendanceAccount.publicKey, // New attendance account
        user: teacherKeypair.publicKey,          // Teacher's public key
        systemProgram: SystemProgram.programId,  // System program
      })
      .signers([attendanceAccount, teacherKeypair]) // Teacher and attendance account sign the transaction
      .rpc();

    // Log success and return the public key of the attendance account
    console.log(`Attendance record successfully stored: ${attendanceAccount.publicKey.toBase58()}`);
    return attendanceAccount.publicKey;
  } catch (err) {
    // Log error and rethrow for higher-level handling
    console.error('Error storing attendance record:', err.message);
    throw err;
  }
}

module.exports = { storeAttendanceRecord };
