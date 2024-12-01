// controllers\TeacherController\teacherController.js

const Session = require('../../models/session');
const Class = require('../../models/class');
const Teacher = require('../../models/teacher')
const AttendanceRecord = require('../../models/attendanceRecord');
const { validationResult } = require('express-validator');


// Get list of classes assigned to the logged-in teacher
exports.getAssignedClasses = async (req, res) => {
    try {
        const teacher = await Teacher.findOne({ user: req.user.id }).populate('user', 'name');

        // If teacher not found, return an error
        if (!teacher) {
            return res.status(404).json({ message: 'Teacher not found' });
        }
        
        // Get classes assigned to the teacher using the teacher's user ID
        const classes = await Class.find({ 'teacher.id': req.user.id });

        // If no classes are found, send a message
        if (classes.length === 0) {
            return res.status(404).json({ message: 'No classes assigned to your account.' });
        }

        // Map the classes to match frontend requirements (id and name format)
        const mappedClasses = classes.map((cls) => ({
            id: cls._id,  // Class ID for the key
            name: `(${cls.courseId}) ${cls.courseName}`, // Format: (CS 222) Data Structures
        }));

        // Return the list of classes
        res.status(200).json({
            classes: mappedClasses  // Send the formatted list of classes
        });

    } catch (error) {
        console.error('Error fetching classes:', error);
        res.status(500).json({ message: 'Unable to load class details. Please try again.' });
    }
};

