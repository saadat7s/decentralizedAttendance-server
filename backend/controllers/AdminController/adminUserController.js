// controllers/AdminController/adminUserController.js

const bcrypt = require('bcryptjs');
const User = require('../../models/user');
const Teacher = require('../../models/teacher');
const Student = require('../../models/student');
const Class = require('../../models/class');
const Wallet = require('../../models/wallet');
const { Keypair } = require('@solana/web3.js');
const { validationResult } = require('express-validator');
const _class = require('../../models/class');
const user = require('../../models/user');
const Session = require('../../models/session');
const student = require('../../models/student');

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
            return res.status(400).json({ message: 'User already exists' });
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

        // Include credentials in response
        res.status(201).json({
            message: 'Teacher registered successfully',
            teacher,
            credentials: { email, password }
        });
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
            return res.status(400).json({ message: 'User already exists' });
        }
        let existingWallet = await Wallet.findOne({ email });
        if (existingWallet) {
            return res.status(400).json({ message: 'Wallet already exists for this email' });
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

        // Include credentials in response
        res.status(201).json({
            message: 'Student registered successfully',
            student,
            credentials: { email, password }
        });
    } catch (err) {
        console.error('Error in registering student:', err.message);
        res.status(500).send('Server error');
    }
};




/**
 * Admin creates a class and assigns students and teachers.
 */
exports.createAndAssignClass = async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }

    const { courseName, courseId, teacherId, studentIds } = req.body;

    try {
        // Step 1: Validate teacher exists and is authorized to be assigned
        const teacher = await Teacher.findOne({ user: teacherId }).populate('user', 'name');
        if (!teacher) {
            return res.status(404).json({ message: 'Teacher not found' });
        }
        const teacherName = teacher.user.name;
        teacher.courses.push(courseName);
        await teacher.save()

        // Step 2: Check for existing class with the same course ID
        const existingClass = await Class.findOne({ courseId });
        if (existingClass) {
            return res.status(400).json({ message: 'Class with this Course ID already exists' });
        }

        // Step 3: Validate student IDs and ensure they exist
        const students = await student.find({ user: { $in: studentIds } }).populate('user', 'name');

        if (students.length !== studentIds.length) {
            return res.status(400).json({ message: 'Some student IDs are invalid or do not exist' });
        }

        // Extract student names using Promise.all for efficiency
        const studentNames = students.map(student => student.user.name);

        // Step 4: Create the class
        const newClass = new Class({
            courseName,
            courseId,
            teacher: {
                id: teacherId,
                name: teacherName,
            },
            students: studentNames,
        });
        await newClass.save();

        // Step 5: Notify the teacher
        console.log(`Notification: Class ${courseName} assigned to teacher ${teacherName}`);
        // Integration: Replace this with an actual email or notification service

        //Pushing courses to student document
        const studentUsers = await student.find({ user: { $in: studentIds } });

        for (const student of studentUsers) {
            student.courses.push(courseName);
            console.log(`Notification: Student ${student.name} added to class ${courseName}`);
            await student.save();
        }

        // Step 7: Respond with success
        res.status(201).json({
            message: 'Class created and assigned successfully',
            class: newClass,
        });

    } catch (err) {
        console.error('Error in creating and assigning class:', err.message);
        res.status(500).json({ message: 'Server error', error: err.message });
    }
};

/**
 * Admin edits an existing class, updating its details, teacher, and/or students.
 */
exports.editClass = async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }

    const { classId, courseName, courseId, teacherId, studentIds } = req.body;

    try {
        // Step 1: Retrieve the existing class
        const existingClass = await Class.findById(classId);
        if (!existingClass) {
            return res.status(404).json({ message: 'Class not found' });
        }

        // Step 2: Validate and update the teacher if provided
        if (teacherId) {
            const teacher = await Teacher.findOne({ user: teacherId });
            if (!teacher) {
                return res.status(404).json({ message: 'Teacher not found' });
            }
            existingClass.teacher = teacher.user;
        }

        // Step 3: Validate and update the students if provided
        if (studentIds && studentIds.length > 0) {
            const students = await Student.find({ user: { $in: studentIds } });
            if (students.length !== studentIds.length) {
                return res.status(400).json({ message: 'Some student IDs are invalid or do not exist' });
            }
            existingClass.students = studentIds;
        }

        // Step 4: Update other class details
        if (courseName) existingClass.courseName = courseName;
        if (courseId) {
            // Ensure no other class has the same courseId
            const duplicateClass = await Class.findOne({ courseId });
            if (duplicateClass && duplicateClass.id !== classId) {
                return res.status(400).json({ message: 'Another class already uses this Course ID' });
            }
            existingClass.courseId = courseId;
        }

        // Save the updated class
        await existingClass.save();

        // Step 5: Notify the updated teacher
        const teacherUser = await User.findById(existingClass.teacher);
        if (teacherUser) {
            console.log(`Notification: Class ${existingClass.courseName} reassigned to teacher ${teacherUser.name}`);
            // Integration: Replace this with an actual email or notification service
        }

        // Step 6: Notify the updated students
        const studentUsers = await User.find({ _id: { $in: existingClass.students } });
        studentUsers.forEach(student => {
            console.log(`Notification: Student ${student.name} reassigned to class ${existingClass.courseName}`);
            // Integration: Replace this with an actual email or notification service
        });

        res.status(200).json({
            message: 'Class updated successfully',
            class: existingClass
        });
    } catch (err) {
        console.error('Error in editing class:', err.message);
        res.status(500).send('Server error');
    }
};

// Create a session for a class
exports.createSession = async (req, res) => {
    const { classId, name, date } = req.body;

    try {
        // Validate required fields
        if (!classId || !name || !date) {
            return res.status(400).json({ message: 'All fields are required.' });
        }

        // Check if the class exists
        const classExists = await Class.findById(classId);
        if (!classExists) {
            return res.status(404).json({ message: 'Class not found.' });
        }


        // Create the session
        const newSession = new Session({
            classId,
            name,
            date,
            createdBy: req.user.id, // Assuming req.user contains the logged-in admin info
        });

        // Save to database
        await newSession.save();

        // Respond to the client
        res.status(201).json({ message: 'Session created successfully', session: newSession });
    } catch (error) {
        console.error('Error creating session:', error);
        res.status(500).json({ message: 'Server error. Please try again later.' });
    }
};


exports.getAllSessions = async (req, res) => {
    try {
        // Fetch all sessions from the database and populate class details
        const sessions = await Session.find().populate('classId', 'courseName');

        // Check if any sessions exist
        if (!sessions || sessions.length === 0) {
            return res.status(404).json({ message: 'No sessions found' });
        }

        // Format the session data to match frontend requirements
        const formattedSessions = sessions.map((session, index) => ({
            id: session._id.toString(),
            number: index + 1, // Sequential numbering
            className: session.classId?.courseName || 'N/A', // Course name from populated class
            sessionName: session.name,
            date: session.date.toISOString().split('T')[0], // Format date as YYYY-MM-DD
            isStarted: session.isStarted ? 'Started' : 'Not Started',
        }));

        // Send formatted sessions in the response
        res.status(200).json({
            message: 'Sessions retrieved successfully',
            sessions: formattedSessions
        });
    } catch (error) {
        console.error('Error fetching sessions:', error);
        res.status(500).json({ message: 'Unable to fetch sessions. Please try again.' });
    }
};



// Retrieve List of Teachers
exports.getAllTeachers = async (req, res) => {
    try {
        const teachers = await Teacher.find().populate('user', ['name', 'email', 'publicKey']);
        res.status(200).json({ message: "All teachers fetched", teachers });
    } catch (err) {
        console.error('Error in retrieving teachers:', err.message);
        res.status(500).send('Server error');
    }
};

// Retrieve List of Students
exports.getAllStudents = async (req, res) => {
    try {
        const students = await Student.find().populate('user', ['name', 'email', 'publicKey']);
        res.status(200).json({ message: 'All students fetched.', students });
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
            return res.status(404).json({ message: 'Teacher not found' });
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
            return res.status(404).json({ message: 'Student not found' });
        }
        res.status(200).json(student);
    } catch (err) {
        console.error('Error in retrieving student information:', err.message);
        res.status(500).send('Server error');
    }
};

exports.getAllClasses = async (req, res) => {
    try {
        const classes = await _class.find({});
        if (classes) {
            return res.status(200).json({ message: "All classes fetched.", classes });
        }
        return res.status(401).json({ message: 'No classes found.' })
    } catch (error) {
        return res.status(500).json({ message: 'Internal Server Error.', error })
    }
}