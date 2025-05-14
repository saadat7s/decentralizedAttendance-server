// server.js

// Import necessary modules
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const morgan = require('morgan');
const dotenv = require('dotenv');
const swaggerUi = require('swagger-ui-express');
const swaggerDocument = require('./swagger.json');

// Import routes
const loginRoutes = require('./routes/AuthRoutes/loginUser');
const profileRoute = require('./routes/profile');
const teacherRoutes = require('./routes/TeacherRoutes/teacherRoutes')
const adminRoutes = require('./routes/AdminRoutes/adminRoutes');
const studentRoutes = require('./routes/StudentRoutes/studentRoutes')

// Load environment variables from .env file
dotenv.config();

// Create an instance of Express
const app = express();

// Middleware setup
app.use(express.json());
app.use(cors());
app.use(morgan('dev'));
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));

// Use routes
app.use('/api/auth/login', loginRoutes);
app.use('/api/profile', profileRoute);
app.use('/api/admin', adminRoutes);
app.use('/api/student', studentRoutes);
app.use('/api/teacher', teacherRoutes);

// Connect to MongoDB
const PORT = process.env.PORT || 5000;
const MONGO_URI = process.env.MONGO_URI;

mongoose.connect(MONGO_URI)
    .then(() => {
        console.log('Connected to MongoDB');
    })
    .catch(err => {
        console.error('Failed to connect to MongoDB', err);
    });

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});

app.get("/", (req, res) => {
    res.status(200).json({ message: "Server Up!" })
})

module.exports = app;
