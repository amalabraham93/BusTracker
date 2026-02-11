const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const rateLimit = require('express-rate-limit');
const globalErrorHandler = require('./middleware/errorMiddleware');
const AppError = require('./utils/AppError');

// Routes
const authRoutes = require('./routes/authRoutes');
const adminRoutes = require('./routes/adminRoutes'); // New
const driverRoutes = require('./routes/driverRoutes');
const schoolRoutes = require('./routes/schoolRoutes');
const parentRoutes = require('./routes/parentRoutes');

const app = express();

// 1. GLOBAL MIDDLEWARE
// Set security HTTP headers
app.use(helmet());

// Implement CORS
app.use(cors());

// Limit requests from same API
const limiter = rateLimit({
    max: 100,
    windowMs: 60 * 60 * 1000,
    message: 'Too many requests from this IP, please try again in an hour!'
});
app.use('/api', limiter);

// Body parser, reading data from body into req.body
app.use(express.json({ limit: '10kb' }));

// Compression
app.use(compression());

// 2. ROUTES
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/admin', adminRoutes); // New
app.use('/api/v1/driver', driverRoutes);
app.use('/api/v1/school', schoolRoutes);
app.use('/api/v1/parent', parentRoutes);

// 3. UNHANDLED ROUTES
// 3. UNHANDLED ROUTES
app.all(/(.*)/, (req, res, next) => {
    next(new AppError(`Can't find ${req.originalUrl} on this server!`, 404));
});

// 4. GLOBAL ERROR HANDLER
app.use(globalErrorHandler);

module.exports = app;
