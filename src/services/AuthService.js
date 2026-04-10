const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const SchoolRepository = require('../repositories/SchoolRepository');
const DriverRepository = require('../repositories/DriverRepository');
const PhoneAuth = require('../models/PhoneAuth');
const StudentRepository = require('../repositories/StudentRepository');
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

        // Remove sensitive fields from output
        if (user.toObject) user = user.toObject();
        user.role = role; // Ensure role is inside the user object too
        delete user.password;
        delete user.otp;
        delete user.otpExpires;
        delete user.otpSecret;

        res.status(statusCode).json({
            status: 'success',
            token,
            role,
            data: {
                user
            }
        });
    }

    async sendOtp(phone, role) {
        // 1. Validate user existence based on role
        if (role === 'driver') {
            const driver = await DriverRepository.findByPhone(phone);
            if (!driver) throw new AppError('No driver found with this phone number', 404);
        } else if (role === 'parent') {
            const student = await StudentRepository.findOne({ parentPhone: phone });
            if (!student) throw new AppError('No parent record found with this phone number', 404);
        }

        // 2. Generate 4-digit OTP
        const otp = Math.floor(1000 + Math.random() * 9000).toString();
        const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

        // 3. Save/Update OTP in PhoneAuth
        await PhoneAuth.findOneAndUpdate(
            { phone, role },
            { otp, expiresAt },
            { upsert: true, new: true }
        );

        // 4. Mock SMS Send
        logger.info(`[SMS] OTP for ${phone} (${role}): ${otp}`);

        return { message: 'OTP sent successfully', otp };
    }

    async verifyOtp(phone, role, otp) {
        // 1. Find OTP record
        const auth = await PhoneAuth.findOne({ phone, role });

        if (!auth) {
            throw new AppError('No OTP request found for this phone number', 400);
        }

        // 2. Verify OTP
        if (auth.otp !== otp) {
            throw new AppError('Invalid OTP', 400);
        }

        if (auth.expiresAt < new Date()) {
            throw new AppError('OTP has expired', 400);
        }

        // 3. Fetch User and Clear OTP
        let user;
        if (role === 'driver') {
            user = await DriverRepository.findByPhone(phone);
        } else if (role === 'parent') {
            // Check if phone exists in student records
            const student = await StudentRepository.findOne({ parentPhone: phone });
            if (!student) throw new AppError('Parent record no longer exists', 404);
            user = { _id: phone, phone, role: 'parent' };
        }

        await PhoneAuth.deleteOne({ _id: auth._id });

        return user;
    }

    async loginSchool(email, password, otp) {
        // ... (existing code, unchanged logic)
        const school = await SchoolRepository.model.findOne({ email }).select('+password +otp +otpExpires');
        if (!school || school.password !== password) {
            throw new AppError('Incorrect email or password', 401);
        }
        return school;
    }

    // Deprecated in favor of new verifyOtp flow but keeping for compatibility if needed
    async loginDriver(phone, otp) {
        return await this.verifyOtp(phone, 'driver', otp);
    }

    async loginParent(phone, otp) {
        return await this.verifyOtp(phone, 'parent', otp);
    }
}

module.exports = new AuthService();
