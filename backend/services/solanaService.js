//services\solanaService.js

const anchor = require('@project-serum/anchor');
const { Connection, PublicKey, Keypair } = require('@solana/web3.js');
const { AnchorProvider, Wallet } = anchor;
const fs = require('fs');
require('dotenv').config();

const idl = require('../services/idl.json');
const programID = new PublicKey('D8Rosv3aMeYruRJrSqHfxuui8wiM6S8h6po9ecRyQJRt');
const network = process.env.ANCHOR_PROVIDER_URL || 'https://api.devnet.solana.com';
const connection = new Connection(network, 'confirmed');

// Load wallet from environment variable (ANCHOR_WALLET) for provider initialization
const secretKey = Uint8Array.from(JSON.parse(fs.readFileSync(process.env.ANCHOR_WALLET, 'utf8'))); 
const wallet = anchor.web3.Keypair.fromSecretKey(secretKey);
const provider = new AnchorProvider(connection, new Wallet(wallet), { preflightCommitment: 'processed' });

anchor.setProvider(provider);

const program = new anchor.Program(idl, programID, provider);

/**
 * Store attendance record on Solana blockchain using the student's wallet.
 *
 * @param {string} studentId - The ID of the student marking attendance.
 * @param {string} sessionId - The session ID being attended.
 * @param {boolean} isPresent - Indicates if the student is present.
 * @param {Keypair} studentKeypair - The student's Solana wallet keypair.
 * @returns {PublicKey} - The public key of the stored attendance account.
 */
async function storeAttendanceRecord(studentId, sessionId, isPresent, studentKeypair) {
  const attendanceAccount = anchor.web3.Keypair.generate();

  try {
    await program.methods.storeAttendance(studentId, sessionId, isPresent).accounts({
      attendance: attendanceAccount.publicKey,
      user: studentKeypair.publicKey, // Use the student's public key
      systemProgram: anchor.web3.SystemProgram.programId,
    }).signers([attendanceAccount, studentKeypair]) // Sign the transaction with the student's keypair
    .rpc();

    console.log(`Attendance record stored: ${attendanceAccount.publicKey}`);
    return attendanceAccount.publicKey; // Return the public key
  } catch (err) {
    console.error('Error storing attendance record:', err);
    throw err; // Rethrow to handle in the calling function
  }
}

/**
 * Retrieve attendance record from the Solana blockchain.
 *
 * @param {PublicKey} publicKey - The public key of the attendance record.
 * @returns {Object} - The decoded attendance data.
 */
async function getAttendanceRecord(publicKey) {
  try {
    const accountInfo = await provider.connection.getAccountInfo(publicKey);
    if (accountInfo === null) {
      throw new Error('Attendance record not found');
    }

    // Decode the attendance data from the account info
    const attendanceData = program.account.attendanceRecord.coder.accounts.decode('AttendanceRecord', accountInfo.data);
    return attendanceData;
  } catch (err) {
    console.error('Error fetching attendance record:', err);
    throw err;
  }
}

module.exports = {
  storeAttendanceRecord,
  getAttendanceRecord,
};
