// controllers/AdminController/createClassController.js

const { validationResult } = require('express-validator');
const Class = require('../../models/class');

exports.createClass = async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }

    const { courseName, courseId, teacherId,  } = req.body;

    try {
        // Check if class already exists
        let classExists = await Class.findOne({ courseId });
        if (classExists) {
            return res.status(400).json({ msg: 'Class already exists' });
        }

        // Create new class
        const newClass = new Class({
            courseName,
            courseId,
            teacher: teacherId
        });

        // Save class to the database
        await newClass.save();

        res.status(201).json({ msg: 'Class created successfully', class: newClass });
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server error');
    }
};
