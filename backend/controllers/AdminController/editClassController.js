// controllers/AdminController/editClassController.js

const { validationResult } = require('express-validator');
const Class = require('../../models/class');
const User = require('../../models/user');

exports.editClass = async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }

    const { classId, studentIds } = req.body;

    try {
        // Verify that the students exist
        const students = await User.find({ _id: { $in: studentIds }, role: 'student' });
        if (students.length !== studentIds.length) {
            return res.status(404).json({ msg: 'One or more students not found' });
        }

        // Update the class with the new list of students
        const updatedClass = await Class.findByIdAndUpdate(
            classId,
            { students: studentIds },
            { new: true }
        ).populate('students');

        if (!updatedClass) {
            return res.status(404).json({ msg: 'Class not found' });
        }

        res.status(200).json({ msg: 'Class updated successfully', class: updatedClass });
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server error');
    }
};
