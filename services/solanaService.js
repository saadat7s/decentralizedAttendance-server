const anchor = require('@project-serum/anchor');
const { Connection, Keypair, SystemProgram, PublicKey, clusterApiUrl } = require('@solana/web3.js');
const fs = require('fs');
const BN = require('bn.js');
require('dotenv').config();

// Helper function to get the program
const getProgram = () => {
  // Read IDL from file
  const idl = require("./idl.json");
  
  // Read wallet keypair from file - this should be your funding wallet
  const walletKeypair = require("./FundingWallet.json");

  const anchorWallet= Keypair.fromSecretKey(new Uint8Array(walletKeypair));
  
  // Connect to Solana network (devnet by default)
  const network = process.env.SOLANA_NETWORK || "devnet";
  const connection = new Connection(
    clusterApiUrl(network), "confirmed"
  );

  // Program ID from your deployed contract
  const programId = new PublicKey("HrQs2YeAy675efyiC7qa1Lrs7iPAg5zNcJXAZ7Y28fVr");

  // Create provider
  const provider = new anchor.AnchorProvider(
    connection,
    new anchor.Wallet(anchorWallet),
    {
      preflightCommitment: "confirmed",
      commitment: "confirmed"
    }
  );
  
  // Set the provider
  anchor.setProvider(provider);

  // Return the program instance, wallet, and connection
  return {
    program: new anchor.Program(idl, programId, provider),
    anchorWallet,
    connection,
  };
};

/**
 * Store an attendance record on the Solana blockchain.
 * @param {string} studentId - The student ID.
 * @param {string} sessionId - The session ID.
 * @param {boolean} isPresent - Whether the student is present.
 * @param {number} markedAt - The timestamp when the attendance was marked.
 * @param {boolean} isFinalized - Whether the attendance is finalized.
 * @returns {Promise<string>} - The public key of the attendance account.
 */
async function storeAttendanceRecord(studentId, sessionId, isPresent, markedAt, isFinalized = false) {
  try {
    // Make sure program is initialized
    const { program } = getProgram();
    
    // Generate a new keypair for the attendance account
    const attendanceAccount = Keypair.generate();

    // Debug log for inputs
    console.log('Storing attendance record with:');
    console.log('Student ID:', studentId);
    console.log('Session ID:', sessionId);
    console.log('Is Present:', isPresent);
    console.log('Is Finalized:', isFinalized);
    console.log('Marked At (Unix Timestamp):', markedAt);
    console.log('Attendance Account Public Key:', attendanceAccount.publicKey.toString());

    // Call the `store_attendance` method in the smart contract
    const tx = await program.methods
      .storeAttendance(
        studentId.toString(),  // Student ID (string)
        sessionId.toString(),  // Session ID (string)
        isPresent,             // Presence Status (bool)
        new BN(markedAt),      // Marked timestamp (BN - i64)
        isFinalized            // Finalized Status (bool)
      )
      .accounts({
        attendance: attendanceAccount.publicKey,    // New attendance account
        user: program.provider.wallet.publicKey,    // Payer for the transaction
        systemProgram: SystemProgram.programId,     // System program
      })
      .signers([attendanceAccount])
      .rpc();

    console.log(`Transaction signature: ${tx}`);
    console.log(`Attendance record successfully stored: ${attendanceAccount.publicKey.toString()}`);
    
    return attendanceAccount.publicKey.toString();
  } catch (err) {
    console.error('Error storing attendance record:', err);
    throw err;
  }
}

/**
 * Get attendance record from the blockchain.
 * @param {string} accountPublicKey - The public key of the attendance account.
 * @returns {Promise<Object>} - The attendance record.
 */
async function getAttendanceRecord(accountPublicKey) {
  try {
    // Initialize the program if not initialized
    const { program } = getProgram();    
    
    // Parse the public key
    const attendanceKey = new PublicKey(accountPublicKey);
    
    // Fetch account data
    const attendanceAccount = await program.account.attendance.fetch(attendanceKey);
    
    // Return the formatted attendance data
    return {
      studentId: attendanceAccount.studentId,
      sessionId: attendanceAccount.sessionId,
      isPresent: attendanceAccount.isPresent,
      markedAt: attendanceAccount.markedAt.toString(),
      isFinalized: attendanceAccount.isFinalized,
      creator: attendanceAccount.creator.toString()
    };
  } catch (err) {
    console.error('Error fetching attendance record:', err);
    throw err;
  }
}

/**
 * Finalize an attendance record on the blockchain.
 * @param {string} accountPublicKey - The public key of the attendance account to finalize.
 * @returns {Promise<string>} - The transaction signature.
 */
async function finalizeAttendanceRecord(accountPublicKey) {
  try {
    // Initialize the program
    const { program } = getProgram();
    
    // Parse the public key
    const attendanceKey = new PublicKey(accountPublicKey);
    
    // Call the finalize_attendance instruction
    const tx = await program.methods
      .finalizeAttendance()
      .accounts({
        attendance: attendanceKey,
        user: program.provider.wallet.publicKey,
      })
      .rpc();
    
    console.log(`Finalization transaction signature: ${tx}`);
    console.log(`Attendance record finalized: ${accountPublicKey}`);
    
    return tx;
  } catch (err) {
    console.error('Error finalizing attendance record:', err);
    throw err;
  }
}

/**
 * Get all attendance records for a specific session.
 * @param {string} sessionId - The session ID to filter by.
 * @returns {Promise<Array>} - Array of attendance records.
 */
async function getAttendanceRecordsBySession(sessionId) {
  try {
    const { program } = getProgram();
    
    // This uses Anchor's getProgramAccounts with a memcmp filter
    // to find all attendance accounts with the matching sessionId
    const accounts = await program.account.attendance.all([
      {
        memcmp: {
          offset: 8, // Skip the 8-byte discriminator
          bytes: anchor.utils.bytes.utf8.encode(sessionId)
        }
      }
    ]);
    
    return accounts.map(acc => ({
      publicKey: acc.publicKey.toString(),
      studentId: acc.account.studentId,
      sessionId: acc.account.sessionId,
      isPresent: acc.account.isPresent,
      markedAt: acc.account.markedAt.toString(),
      isFinalized: acc.account.isFinalized,
      creator: acc.account.creator.toString()
    }));
  } catch (err) {
    console.error('Error fetching attendance records by session:', err);
    throw err;
  }
}

/**
 * Get all attendance records for a specific student.
 * @param {string} studentId - The student ID to filter by.
 * @returns {Promise<Array>} - Array of attendance records.
 */
async function getAttendanceRecordsByStudent(studentId) {
  try {
    const { program } = getProgram();
    
    // Use getProgramAccounts with a filter for studentId
    const accounts = await program.account.attendance.all([
      {
        memcmp: {
          offset: 8, // Skip the 8-byte discriminator
          bytes: anchor.utils.bytes.utf8.encode(studentId)
        }
      }
    ]);
    
    return accounts.map(acc => ({
      publicKey: acc.publicKey.toString(),
      studentId: acc.account.studentId,
      sessionId: acc.account.sessionId,
      isPresent: acc.account.isPresent,
      markedAt: acc.account.markedAt.toString(),
      isFinalized: acc.account.isFinalized,
      creator: acc.account.creator.toString()
    }));
  } catch (err) {
    console.error('Error fetching attendance records by student:', err);
    throw err;
  }
}

module.exports = {
  storeAttendanceRecord,
  getAttendanceRecord,
  finalizeAttendanceRecord,
  getAttendanceRecordsBySession,
  getAttendanceRecordsByStudent
};