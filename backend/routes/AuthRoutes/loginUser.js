// routes/AuthRoutes/loginUser.js

const express = require('express');
const { check } = require('express-validator');
const { loginUser } = require('../../controllers/AuthController/loginUserController');

const router = express.Router();

router.post(
    '/',
    [
        check('email', 'Please include a valid email').isEmail(),
        check('password', 'Password is required').exists()
    ],
    loginUser
);

module.exports = router;
