// routes/AuthRoutes/loginUser.js
const express = require('express');
const { check } = require('express-validator');
const { loginUser, getUserProfile, userLogout } = require('../../controllers/AuthController/loginUserController');
const { isAuth } = require('../../middlewares/authMiddleware');

const router = express.Router();

router.post(
    '/',
    [
        check('email', 'Please include a valid email').isEmail(),
        check('password', 'Password is required').exists()
    ],
    loginUser
);

router.get('/user-profile', isAuth, getUserProfile)
router.get('/logout', userLogout)

module.exports = router;
