// controllers/AdminController/adminUserController.js

const bcrypt = require('bcryptjs');
const User = require('../../models/user');
const Teacher = require('../../models/teacher');
const Student = require('../../models/student');
const Class = require('../../models/class');
const Wallet = require('../../models/wallet');
const { Keypair } = require('@solana/web3.js');
const { validationResult } = require('express-validator');

// Register a Teacher
exports.registerTeacher = async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }

    const { name, email, password, faculty, designation, officeLocation } = req.body;

    try {
        // Check if user already exists
        let user = await User.findOne({ email });
        if (user) {
            return res.status(400).json({ msg: 'User already exists' });
        }

        // Create new Solana wallet
        const newWallet = Keypair.generate();
        const publicKey = newWallet.publicKey.toString();
        const secretKey = Array.from(newWallet.secretKey);

        // Create new User
        user = new User({
            name,
            email,
            password,
            role: 'teacher',
            publicKey
        });

        // Hash the password
        const salt = await bcrypt.genSalt(10);
        user.password = await bcrypt.hash(password, salt);
        await user.save();

        // Save wallet details
        const wallet = new Wallet({
            email,
            publicKey,
            secretKey
        });
        await wallet.save();

        // Create Teacher profile
        const teacher = new Teacher({
            user: user._id,
            faculty,
            designation,
            officeLocation
        });
        await teacher.save();

        res.status(201).json({ msg: 'Teacher registered successfully', teacher });
    } catch (err) {
        console.error('Error in registering teacher:', err.message);
        res.status(500).send('Server error');
    }
};

// Register a Student
exports.registerStudent = async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }

    const { name, email, password, rollNumber, department, semester, program, admissionYear, batch } = req.body;

    try {
        // Check if user already exists
        let user = await User.findOne({ email });
        if (user) {
            return res.status(400).json({ msg: 'User already exists' });
        }

        // Create new Solana wallet
        const newWallet = Keypair.generate();
        const publicKey = newWallet.publicKey.toString();
        const secretKey = Array.from(newWallet.secretKey);

        // Create new User
        user = new User({
            name,
            email,
            password,
            role: 'student',
            publicKey
        });

        // Hash the password
        const salt = await bcrypt.genSalt(10);
        user.password = await bcrypt.hash(password, salt);
        await user.save();

        // Save wallet details
        const wallet = new Wallet({
            email,
            publicKey,
            secretKey
        });
        await wallet.save();

        // Create Student profile
        const student = new Student({
            user: user._id,
            rollNumber,
            department,
            semester,
            program,
            admissionYear,
            batch
        });
        await student.save();

        res.status(201).json({ msg: 'Student registered successfully', student });
    } catch (err) {
        console.error('Error in registering student:', err.message);
        res.status(500).send('Server error');
    }
};

// Create and Assign a Class
exports.createAndAssignClass = async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }

    const { courseName, courseId, teacherId, studentIds } = req.body;

    try {
        // Ensure the teacher exists
        const teacher = await Teacher.findOne({ user: teacherId });
        if (!teacher) {
            return res.status(404).json({ msg: 'Teacher not found' });
        }

        // Check if class already exists
        let existingClass = await Class.findOne({ courseId });
        if (existingClass) {
            return res.status(400).json({ msg: 'Class already exists' });
        }

        // Validate student IDs
        const students = await Student.find({ user: { $in: studentIds } });
        if (students.length !== studentIds.length) {
            return res.status(400).json({ msg: 'Some student IDs are invalid' });
        }

        // Create new class
        const newClass = new Class({
            courseName,
            courseId,
            teacher: teacher.user,
            students: studentIds
        });
        await newClass.save();

        res.status(201).json({ msg: 'Class created and assigned successfully', class: newClass });
    } catch (err) {
        console.error('Error in creating and assigning class:', err.message);
        res.status(500).send('Server error');
    }
};

// Retrieve List of Teachers
exports.getAllTeachers = async (req, res) => {
    try {
        const teachers = await Teacher.find().populate('user', ['name', 'email', 'publicKey']);
        res.status(200).json(teachers);
    } catch (err) {
        console.error('Error in retrieving teachers:', err.message);
        res.status(500).send('Server error');
    }
};

// Retrieve List of Students
exports.getAllStudents = async (req, res) => {
    try {
        const students = await Student.find().populate('user', ['name', 'email', 'publicKey']);
        res.status(200).json(students);
    } catch (err) {
        console.error('Error in retrieving students:', err.message);
        res.status(500).send('Server error');
    }
};

// Retrieve Information for a Specific Teacher
exports.getTeacherById = async (req, res) => {
    try {
        const teacher = await Teacher.findOne({ user: req.params.id }).populate('user', ['name', 'email', 'publicKey']);
        if (!teacher) {
            return res.status(404).json({ msg: 'Teacher not found' });
        }
        res.status(200).json(teacher);
    } catch (err) {
        console.error('Error in retrieving teacher information:', err.message);
        res.status(500).send('Server error');
    }
};

// Retrieve Information for a Specific Student
exports.getStudentById = async (req, res) => {
    try {
        const student = await Student.findOne({ user: req.params.id }).populate('user', ['name', 'email', 'publicKey']);
        if (!student) {
            return res.status(404).json({ msg: 'Student not found' });
        }
        res.status(200).json(student);
    } catch (err) {
        console.error('Error in retrieving student information:', err.message);
        res.status(500).send('Server error');
    }
};
