const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const SchoolRepository = require('../repositories/SchoolRepository');
const DriverRepository = require('../repositories/DriverRepository');
const AppError = require('../utils/AppError');
const logger = require('../utils/logger');

class AuthService {
    signToken(id, role) {
        return jwt.sign({ id, role }, process.env.JWT_SECRET, {
            expiresIn: process.env.JWT_EXPIRES_IN || '15m'
        });
    }

    createSendToken(user, role, statusCode, res) {
        const token = this.signToken(user._id, role);

        // Remove password from output
        user.password = undefined;
        user.otpSecret = undefined;

        res.status(statusCode).json({
            status: 'success',
            token,
            data: {
                user
            }
        });
    }

    async loginSchool(email, password) {
        // Simple password check (should use bcrypt in real app)
        const school = await SchoolRepository.findByEmail(email);
        if (!school || school.password !== password) {
            throw new AppError('Incorrect email or password', 401);
        }
        return school;
    }

    async loginDriver(phone, otp) {
        // Mock OTP verification
        if (otp !== '1234') { // Fixed OTP for demo
            throw new AppError('Invalid OTP', 400);
        }

        const driver = await DriverRepository.findByPhone(phone);
        if (!driver) {
            throw new AppError('Driver not found', 404);
        }
        return driver;
    }

    // Parent Login would be similar to Driver (Phone + OTP)
    // For MVP, we can treat parent login lightly since we don't have a Parent model 
    // but rather link via Student. Use a generic "Parent" role token.
    async loginParent(phone, otp) {
        if (otp !== '1234') {
            throw new AppError('Invalid OTP', 400);
        }
        // Just verify phone format or existance in Student repo if stricter
        return { _id: phone, phone, role: 'parent' }; // Using phone as ID for parent
    }
}

module.exports = new AuthService();
