// models/student.js
const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const studentSchema = new Schema({
  user: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  rollNumber: { type: String, required: true, unique: true },
  department: { type: String, required: true },
  semester: { type: Number, required: true },
  program: { type: String, required: true },
  admissionYear: { type: Number, required: true },
  batch: { type: String, required: true },
  courses: [{ type: String }]
}, { timestamps: true });

module.exports = mongoose.model('Student', studentSchema);