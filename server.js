const express = require('express');
const dotenv = require('dotenv');
const cookieParser = require('cookie-parser');
const connectDB = require('./config/db');

// Load env vars
dotenv.config({ path: './config/config.env' });

// Connect to database
connectDB();

// route files
const hospitals = require('./routes/hospitals');
const auth = require('./routes/auth');

const app = express();
// add body parser
// app.use(express.json());
//Mount routers
app.use(express.json()); // Body parser middleware
app.use('/api/v1/hospitals', hospitals);
app.use('/api/v1/auth', auth);
// cookie parser
app.use(cookieParser());

const PORT = process.env.PORT || 5000;

const Server=app.listen(PORT, () => {
    console.log(`Server running in ${process.env.NODE_ENV} mode on port ${PORT}`);
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (err, promise) => {
    console.log(`Error: ${err.message}`);
    // Close server & exit process
    Server.close(() => process.exit(1));
});