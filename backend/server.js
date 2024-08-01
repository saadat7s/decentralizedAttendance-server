// server.js

// Import necessary modules
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const morgan = require('morgan');
const dotenv = require('dotenv');

// Import routes
const authRoutes = require('./routes/AuthRoutes/registerUser');
const loginRoutes = require('./routes/AuthRoutes/loginUser');
const profileRoute = require('./routes/profile');
const studentMarkAttendance = require('./routes/StudentRoutes/markAttendance');
const teacherSelectClass = require('./routes/TeacherRoutes/selectClass');
const teacherStartSession = require('./routes/TeacherRoutes/startSession');
const teacherEndSession = require('./routes/TeacherRoutes/endSession');
const adminCreateClass = require('./routes/AdminRoutes/createClass');
const adminEditClass = require('./routes/AdminRoutes/editClass'); 
const getAttendanceRoute = require('./routes/StudentRoutes/getAttendance');

// Load environment variables from .env file
dotenv.config();

// Create an instance of Express
const app = express();

// Middleware setup
app.use(express.json());
app.use(cors());
app.use(morgan('dev'));

// Use routes
app.use('/api/auth/register', authRoutes);
app.use('/api/auth/login', loginRoutes);
app.use('/api/profile', profileRoute);
app.use('/api/student/markAttendance', studentMarkAttendance);
app.use('/api/teacher/selectClass', teacherSelectClass);
app.use('/api/teacher/startSession', teacherStartSession);
app.use('/api/teacher/endSession', teacherEndSession);
app.use('/api/admin/createClass', adminCreateClass);
app.use('/api/admin/editClass', adminEditClass); 
app.use('/api/student/getAttendance', getAttendanceRoute);

// Connect to MongoDB
const PORT = process.env.PORT || 5000;
const MONGO_URI = process.env.MONGO_URI;

mongoose.connect(MONGO_URI)
.then(() => {
    console.log('Connected to MongoDB');
    // Start the server
    app.listen(PORT, () => {
        console.log(`Server is running on port ${PORT}`);
    });
})
.catch(err => {
    console.error('Failed to connect to MongoDB', err);
});

module.exports = app;
