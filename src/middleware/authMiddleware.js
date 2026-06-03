const jwt = require('jsonwebtoken');
const { promisify } = require('util');
const AppError = require('../utils/AppError');
const catchAsync = require('../utils/catchAsync');
const School = require('../models/School'); // Example user model
const Driver = require('../models/Driver');

exports.protect = catchAsync(async (req, res, next) => {
    // 1) Getting token and check of it's there
    let token;
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
        token = req.headers.authorization.split(' ')[1];
    }

    if (!token) {
        return next(new AppError('You are not logged in! Please log in to get access.', 401));
    }

    // 1.5) Check if token is blacklisted (logged out)
    const { client: redisClient } = require('../config/redis');
    const isBlacklisted = await redisClient.get(`blacklist:${token}`);
    if (isBlacklisted) {
        return next(new AppError('Your session has expired. Please log in again.', 401));
    }

    // 2) Verification token
    const decoded = await promisify(jwt.verify)(token, process.env.JWT_SECRET);

    // 3) Check if user still exists
    // Logic depends on role. Decoded usually contains ID and Role.
    // For now simplistic check.

    // Attach user to request
    req.user = decoded;
    next();
});

exports.restrictTo = (...roles) => {
    return (req, res, next) => {
        if (!roles.includes(req.user.role)) {
            return next(new AppError('You do not have permission to perform this action', 403));
        }
        next();
    };
};
