
// models\session.js

const mongoose = require('mongoose');

const sessionSchema = new mongoose.Schema({
    classId: { type: mongoose.Schema.Types.ObjectId, ref: 'Class', required: true },
    name: { type: String, required: true },
    date: { type: Date, required: true },
    ended: { type: Boolean, default: false },
    isStarted: {
        type: Boolean,
        default: false,
    },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }, // Admin creating the session
});

module.exports = mongoose.model('Session', sessionSchema);
