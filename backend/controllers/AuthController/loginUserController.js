//controllers/AuthController/loginController.js
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { validationResult } = require('express-validator');
const User = require('../../models/user');
const student = require('../../models/student');
const teacher = require('../../models/teacher');

exports.loginUser = async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }

    const { email, password } = req.body;

    try {
        // Step 1: Check if user exists
        let user = await User.findOne({ email });
        if (!user) {
            return res.status(400).json({ message: 'Invalid credentials' });
        }

        // Step 2: Validate password
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(400).json({ message: 'Invalid credentials' });
        }

        // Step 3: Role-based validation
        if (user.role !== 'student' && user.role !== 'teacher' && user.role !== 'admin') {
            return res.status(403).json({ message: 'Unauthorized role' });
        }

        // Step 4: Create and return JWT token
        const payload = {
            user: {
                id: user.id,
                role: user.role,
                email: user.email
            }
        };

        jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '5d' }, (err, token) => {
            if (err) throw err;

            // Respond with token and public key
            res.json({
                message: `Login successful for ${user.role}`,
                role: user.role,
                token,
                publicKey: user.publicKey
            });
        });
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server error');
    }
};
exports.userLogout = async (req, res, next) => {
    const token = req.headers['x_auth_token'];
    // ToDo: invalidate token
    try {
        res.status(200).json({ message: 'Logout successful' });
    } catch (err) {
        res.status(500).json({
            message: 'Error logging out'
        });
    }
}

exports.getUserProfile = async (req, res) => {
    const { id } = req.user;
    try {
        const user = await User.findById(id);
        if (user) {
            let userDetails;
            if (user.role === 'student') {
                userDetails = await student.findById(id);
            }
            if (user.role === 'teacher') {
                userDetails = await teacher.findById(id);
            }
            return res.status(200).json({ message: 'User profile fetched.', user });
        }
        res.status(401).json({ message: 'No user found.' });
    } catch (error) {
        return res.status(500).json({ message: 'Internal Server Error.', error })
    }
}