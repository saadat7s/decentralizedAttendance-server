
// models\session.js

const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const sessionSchema = new Schema({
    name: {
        type: String,
        required: true
    },
    startTime: {
        type: Date,
        required: true
    },
    endTime: {
        type: Date,
        required: true
    },
    class: {
        type: Schema.Types.ObjectId,
        ref: 'Class',
        required: true
    },
    teacher: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    isCompleted: {
        type: Boolean,
        default: false
    }, 
    isFinalized: { // New field to track finalization
        type: Boolean,
        default: false
    }
}, { timestamps: true });

module.exports = mongoose.model('Session', sessionSchema);
