const { PublicKey } = require('@solana/web3.js');
const { getAttendanceRecord } = require('../../services/solanaService');

exports.getAttendance = async (req, res) => {
  const { publicKey } = req.params;

  try {
    // Ensure the public key is correctly parsed
    const pubKey = new PublicKey(publicKey);
    const attendanceRecord = await getAttendanceRecord(pubKey);
    res.status(200).json(attendanceRecord);
  } catch (err) {
    console.error('Error fetching attendance record:', err.message);
    res.status(500).send('Server error');
  }
};
