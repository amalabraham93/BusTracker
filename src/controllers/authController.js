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
        const { phone, otp } = req.body;
        if (!phone || !otp) return next(new AppError('Please provide phone and OTP', 400));
        user = await AuthService.loginDriver(phone, otp);
    }
    else if (role === 'parent') {
        const { phone, otp } = req.body;
        if (!phone || !otp) return next(new AppError('Please provide phone and OTP', 400));
        user = await AuthService.loginParent(phone, otp);
    }
    else if (role === 'admin') {
        // Mock Admin login or implement Admin service
        const { email, password } = req.body;
        if (email === 'admin@admin.com' && password === 'admin123') {
            user = { _id: 'admin_id', name: 'Super Admin', email, role: 'admin' };
        } else {
            return next(new AppError('Invalid admin credentials', 401));
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

exports.logout = (req, res) => {
    // For standard stateless JWT, logout is usually just client-side token clearing.
    res.status(200).json({
        status: 'success',
        message: 'Logged out successfully!'
    });
};
