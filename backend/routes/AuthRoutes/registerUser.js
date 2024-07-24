// routes/AuthRoutes/registerUser.js

const express = require('express');
const { check } = require('express-validator');
const { registerUser } = require('../../controllers/AuthController/registerUserController');

const router = express.Router();

router.post(
    '/',
    [
        check('name', 'Name is required').not().isEmpty(),
        check('email', 'Please include a valid email').isEmail(),
        check('password', 'Password must be at least 6 characters long').isLength({ min: 6 }),
        check('role', 'Role is required').not().isEmpty()
    ],
    (req, res, next) => {
        console.log('Register route hit');
        next();
    },
    registerUser
);

module.exports = router;
