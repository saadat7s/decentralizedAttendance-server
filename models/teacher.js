  // models/teacher.js
  const mongoose = require('mongoose');
  const Schema = mongoose.Schema;

  const teacherSchema = new Schema({
      user: { type: Schema.Types.ObjectId, ref: 'User', required: true },
      faculty: { type: String, required: true },
      designation: { type: String, required: true },
      officeLocation: { type: String },
      courses: [{ type: String }]
    }, { timestamps: true });

    module.exports = mongoose.model('Teacher', teacherSchema);