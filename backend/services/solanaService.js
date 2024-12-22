
const anchor = require('@project-serum/anchor');
const { Connection, Keypair, SystemProgram, PublicKey } = require('@solana/web3.js');
const fs = require('fs');
const BN = require('bn.js');
require('dotenv').config();

// Load the IDL for the program
const idl = require('../services/idl.json');
const programID = new anchor.web3.PublicKey('7HMBCUzKs9dAxjZo1jkfe42rM66acJRcCydGZt39V5ZR');
const network = process.env.ANCHOR_PROVIDER_URL || 'https://api.devnet.solana.com';
const connection = new Connection(network, 'confirmed');

// Load the Anchor wallet keypair
const secretKey = Uint8Array.from(JSON.parse(fs.readFileSync(process.env.ANCHOR_WALLET, 'utf8')));
const anchorWalletKeypair = Keypair.fromSecretKey(secretKey);
const provider = new anchor.AnchorProvider(connection, new anchor.Wallet(anchorWalletKeypair), {
  preflightCommitment: 'processed',
});
anchor.setProvider(provider);

const program = new anchor.Program(idl, programID, provider);

/**
 * Store an attendance record on the Solana blockchain.
 * @param {string} sessionId - The session ID.
 * @param {string} studentId - The student ID.
 * @param {boolean} isPresent - Whether the student is present.
 * @param {number} markedAt - The timestamp when the attendance was marked.
 * @param {boolean} isFinalized - Whether the attendance is finalized.
 * @returns {string} - The public key of the attendance account.
 */
async function storeAttendanceRecord(sessionId, studentId, isPresent, markedAt, isFinalized) {
  // Generate a new keypair for the attendance account
  const attendanceAccount = Keypair.generate();

  try {
    // Debug log for inputs
    console.log('Session ID:', sessionId);
    console.log('Student ID:', studentId);
    console.log('Is Present:', isPresent);
    console.log('Is Finalized:', isFinalized);
    console.log('Marked At (Unix Timestamp):', markedAt);
    console.log('Attendance Account Public Key:', attendanceAccount.publicKey.toBase58());

    // Call the `store_attendance` method in the smart contract
    const tx = await program.methods
      .storeAttendance(
        sessionId,  // Session ID (string)
        studentId,  // Student ID (string)
        isPresent,  // Presence Status (bool)
        new BN(markedAt), // Marked timestamp (BN - i64)
        isFinalized // Finalized Status (bool)
      )
      .accounts({
        attendance: attendanceAccount.publicKey, // New attendance account
        user: anchorWalletKeypair.publicKey,    // Anchor wallet is the payer
        systemProgram: SystemProgram.programId, // System program
      })
      .signers([attendanceAccount, anchorWalletKeypair]) // Signers for the transaction
      .rpc();

    // Log success and return the public key of the attendance account
    console.log(`Attendance record successfully stored: ${attendanceAccount.publicKey.toBase58()}`);
    return attendanceAccount.publicKey.toBase58();
  } catch (err) {
    // Log error and rethrow for higher-level handling
    console.error('Error storing attendance record:', err.message);
    throw err;
  }
}



// Fetch attendance record by account public key
async function getAttendanceRecord(accountPublicKey) {
  try {
    // Initialize the connection and program
    const network = process.env.ANCHOR_PROVIDER_URL || 'https://api.devnet.solana.com';
    const connection = new Connection(network, 'confirmed');
    const idl = require('../services/idl.json'); // Smart contract IDL
    const programID = new PublicKey('7HMBCUzKs9dAxjZo1jkfe42rM66acJRcCydGZt39V5ZR');
    const provider = anchor.AnchorProvider.local(network);
    anchor.setProvider(provider);
    const program = new anchor.Program(idl, programID, provider);

    // Fetch the account data
    const attendanceAccount = new PublicKey(accountPublicKey);
    const accountData = await program.account.attendance.fetch(attendanceAccount);

    // Return the fetched attendance data
    return {
      studentId: accountData.studentId,
      sessionId: accountData.sessionId,
      isPresent: accountData.isPresent,
      markedAt: accountData.markedAt.toString(), // Convert BN to string
      isFinalized: accountData.isFinalized,
    };
  } catch (err) {
    console.error('Error fetching attendance record:', err.message);
    throw err;
  }
}

module.exports = { storeAttendanceRecord, getAttendanceRecord };
