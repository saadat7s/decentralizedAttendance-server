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
    markedBy: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    isPresent: {
        type: Boolean,
        default: false
    },
    markedAt: {
        type: Date,
        default: Date.now
    }, isFinalized: { 
        type: Boolean,
        default: false
    }
});

module.exports = mongoose.model('AttendanceRecord', attendanceRecordSchema);
