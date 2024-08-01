const express = require('express');
const { getAttendance } = require('../../controllers/StudentController/getAttendanceController');
const router = express.Router();

router.get('/:publicKey', getAttendance);

module.exports = router;
