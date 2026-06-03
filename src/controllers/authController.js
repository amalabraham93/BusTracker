const AuthService = require('../services/AuthService');
const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/AppError');

exports.login = catchAsync(async (req, res, next) => {
    const { role } = req.body;

    if (!role) {
        return next(new AppError('Please select a role', 400));
    }

    let user;
    if (role === 'school') {
        const { email, password, otp } = req.body;
        if (!email || !password) return next(new AppError('Please provide email and password', 400));

        try {
            user = await AuthService.loginSchool(email, password, otp);
        } catch (err) {
            if (err.statusCode === 202) {
                return res.status(202).json({
                    status: 'pending',
                    message: err.message
                });
            }
            throw err;
        }
    }
    else if (role === 'driver') {
        const { phone, otp, email, password } = req.body;
        if (email && password) {
            user = await AuthService.loginDriverEmail(email, password);
        } else if (phone && otp) {
            user = await AuthService.loginDriver(phone, otp);
        } else {
            return next(new AppError('Please provide phone and OTP, or email and password', 400));
        }
    }
    else if (role === 'parent') {
        const { phone, otp, email, password } = req.body;
        if (email && password) {
            user = await AuthService.loginParentEmail(email, password);
        } else if (phone && otp) {
            user = await AuthService.loginParent(phone, otp);
        } else {
            return next(new AppError('Please provide phone and OTP, or email and password', 400));
        }
    }
    else if (role === 'admin') {
        // Mock Admin login or implement Admin service
        const { email, password } = req.body;
        if (email === 'admin@admin.com' && password === 'admin123') {
            user = { _id: 'admin_id', name: 'Super Admin', email, role: 'admin' };
        } else {
            return next(new AppError('Invalid admin credentials', 400));
        }
    }
    else {
        return next(new AppError('Invalid role selected', 400));
    }

    AuthService.createSendToken(user, role, 200, res);
});

exports.requestOtp = catchAsync(async (req, res, next) => {
    const { phone, role } = req.body;

    if (!phone || !role) {
        return next(new AppError('Please provide phone number and role', 400));
    }

    if (!['driver', 'parent'].includes(role)) {
        return next(new AppError('OTP system only supported for Drivers and Parents', 400));
    }

    const result = await AuthService.sendOtp(phone, role);

    res.status(200).json({
        status: 'success',
        message: result.message,
        role,
        otp: result.otp
    });
});

exports.verifyOtp = catchAsync(async (req, res, next) => {
    const { phone, role, otp } = req.body;

    if (!phone || !role || !otp) {
        return next(new AppError('Please provide phone, role, and OTP', 400));
    }

    const user = await AuthService.verifyOtp(phone, role, otp);

    AuthService.createSendToken(user, role, 200, res);
});

exports.logout = catchAsync(async (req, res, next) => {
    let token;
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
        token = req.headers.authorization.split(' ')[1];
    }

    if (token) {
        const { client: redisClient } = require('../config/redis');
        const jwt = require('jsonwebtoken');
        
        try {
            // Decode the token to get expiration time
            const decoded = jwt.verify(token, process.env.JWT_SECRET);
            const expTime = decoded.exp - Math.floor(Date.now() / 1000);
            
            if (expTime > 0) {
                // Add token to Redis blacklist for the remaining validity duration
                await redisClient.set(`blacklist:${token}`, 'true', { EX: expTime });
            }
        } catch (e) {
            // Ignore if token is already expired or invalid
        }
    }

    res.status(200).json({
        status: 'success',
        message: 'Logged out successfully!'
    });
});

exports.changePassword = catchAsync(async (req, res, next) => {
    const { currentPassword, newPassword } = req.body;
    const userId = req.user.id;
    const role = req.user.role;

    await AuthService.changePassword(userId, role, currentPassword, newPassword);

    res.status(200).json({
        status: 'success',
        message: 'Password changed successfully!'
    });
});
