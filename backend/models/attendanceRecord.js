// models\attendanceRecord.js
const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const attendanceRecordSchema = new Schema({
    session: {
        type: Schema.Types.ObjectId,
        ref: 'Session',
        required: true
    },
    student: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    studentSignature: {
        type: String,
        required: false
    },
    markedBy: {
        type: String,
        required: false
    },
    isPresent: {
        type: Boolean,
        default: false
    },
    markedAt: {
        type: Date,
        default: Date.now()
    }, isFinalized: {
        type: Boolean,
        default: false
    },
    isBroadcasted: { type: Boolean, default: false },
    broadcastTransactionSignature: String, 
});

module.exports = mongoose.model('AttendanceRecord', attendanceRecordSchema);
