// routes/profile.js

const express = require('express');
const { isAuth } = require('../middlewares/authMiddleware');
const User = require('../models/user');

const router = express.Router();

router.get('/', isAuth, async (req, res) => {
    try {
        const user = await User.findById(req.user.id).select('-password');
        res.json(user);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server error');
    }
});

module.exports = router;
