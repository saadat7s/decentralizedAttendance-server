// routes/TeacherRoutes/selectClass.js

const express = require('express');
const auth = require('../../middlewares/authMiddleware');
const { selectClass } = require('../../controllers/TeacherController/selectClassController');

const router = express.Router();

// Select class route
router.get('/', auth, selectClass);

module.exports = router;
