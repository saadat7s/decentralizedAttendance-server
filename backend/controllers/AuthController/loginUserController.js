//controllers/AuthController/loginController.js
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { validationResult } = require('express-validator');
const User = require('../../models/user');

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
            return res.status(400).json({ msg: 'Invalid credentials' });
        }

        // Step 2: Validate password
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(400).json({ msg: 'Invalid credentials' });
        }

        // Step 3: Role-based validation
        if (user.role !== 'student' && user.role !== 'teacher' && user.role !== 'admin') {
            return res.status(403).json({ msg: 'Unauthorized role' });
        }

        // Step 4: Create and return JWT token
        const payload = {
            user: {
                id: user.id,
                role: user.role,
                email: user.email
            }
        };

        jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '1h' }, (err, token) => {
            if (err) throw err;

            // Respond with token and public key
            res.json({
                msg: `Login successful for ${user.role}`,
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
