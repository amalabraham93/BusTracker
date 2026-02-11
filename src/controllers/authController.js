const AuthService = require('../services/AuthService');
const catchAsync = require('../utils/catchAsync');

exports.loginSchool = catchAsync(async (req, res, next) => {
    const { email, password } = req.body;
    if (!email || !password) {
        return next(new AppError('Please provide email and password', 400));
    }
    const school = await AuthService.loginSchool(email, password);
    AuthService.createSendToken(school, 'school', 200, res);
});

exports.loginDriver = catchAsync(async (req, res, next) => {
    const { phone, otp } = req.body;
    if (!phone || !otp) {
        return next(new AppError('Please provide phone and OTP', 400));
    }
    const driver = await AuthService.loginDriver(phone, otp);
    AuthService.createSendToken(driver, 'driver', 200, res);
});

exports.loginParent = catchAsync(async (req, res, next) => {
    const { phone, otp } = req.body;
    if (!phone || !otp) {
        return next(new AppError('Please provide phone and OTP', 400));
    }
    const parent = await AuthService.loginParent(phone, otp);
    // Custom token creation for parent since structure differs slightly
    AuthService.createSendToken(parent, 'parent', 200, res);
});
