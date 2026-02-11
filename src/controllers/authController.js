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
        const { email, password } = req.body;
        if (!email || !password) return next(new AppError('Please provide email and password', 400));
        user = await AuthService.loginSchool(email, password);
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
