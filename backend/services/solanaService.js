const anchor = require('@project-serum/anchor');
const { Connection, PublicKey } = require('@solana/web3.js');
const {AnchorProvider, Wallet } = anchor;
const fs = require('fs');
require('dotenv').config();

const idl = require('../services/idl.json'); 
const programID = new PublicKey('D8Rosv3aMeYruRJrSqHfxuui8wiM6S8h6po9ecRyQJRt'); 
const network = process.env.ANCHOR_PROVIDER_URL || 'https://api.devnet.solana.com';
const connection = new Connection(network, 'confirmed');

// Load wallet from environment variable
const secretKey = Uint8Array.from(JSON.parse(fs.readFileSync(process.env.ANCHOR_WALLET, 'utf8')));
const wallet = anchor.web3.Keypair.fromSecretKey(secretKey);
const provider = new anchor.AnchorProvider(connection, new Wallet(wallet), { preflightCommitment: 'processed' });

anchor.setProvider(provider);

const program = new anchor.Program(idl, programID, provider);

async function storeAttendanceRecord(studentId, sessionId, isPresent) {
  const attendanceAccount = anchor.web3.Keypair.generate();

  try {
    await program.rpc.storeAttendance(studentId, sessionId, isPresent, {
      accounts: {
        attendance: attendanceAccount.publicKey,
        user: provider.wallet.publicKey,
        systemProgram: anchor.web3.SystemProgram.programId,
      },
      signers: [attendanceAccount],
    });

    console.log(`Attendance record stored: ${attendanceAccount.publicKey}`);
    return attendanceAccount.publicKey; // Return the public key
  } catch (err) {
    console.error('Error storing attendance record:', err);
    throw err; // Rethrow to handle in the calling function
  }
}

async function getAttendanceRecord(publicKey) {
  try {
    const accountInfo = await provider.connection.getAccountInfo(publicKey);
    if (accountInfo === null) {
      throw new Error('Attendance record not found');
    }

    // Ensure the method to decode is correct
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
