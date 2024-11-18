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

//TODO: Remove nested folders, example: adminRoutes files do not need a separate folder and can be placed in the routes folder.
//Reason: Too much nested folders causes import issues.

//TODO-2: Conventions are to use Capitalized names for databases;
// TODO-3: use lowercase separated by "-" in routes.
// TODO-4: Implement functional admin auth middleware

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
        // Start the server
        app.listen(PORT, () => {
            console.log(`Server is running on port ${PORT}`);
        });
    })
    .catch(err => {
        console.error('Failed to connect to MongoDB', err);
    });

module.exports = app;
