
// models\class.js
const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const classSchema = new Schema({
    courseName: {
        type: String,
        required: true
    },
    courseId: {
        type: String,
        required: true,
        unique: true
    },
    teacher: {
        id: {
            type: Schema.Types.ObjectId,
            ref: 'User',
            required: true
        },
        name: {
            type: String,
            required: true,
            default: ''
        }
    },
    students: []
}, { timestamps: true });

module.exports = mongoose.model('Class', classSchema);
