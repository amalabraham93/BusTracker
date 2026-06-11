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
        return jwt.sign({ id, role }, process.env.JWT_SECRET);
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
            { upsert: true, returnDocument: 'after' }
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
            user = await DriverRepository.model.findOne({ phone }).populate('schoolId', 'name email address phone');
        } else if (role === 'parent') {
            // Check if phone exists in student records
            const student = await StudentRepository.model.findOne({ parentPhone: phone }).populate('schoolId', 'name email address phone');
            if (!student) throw new AppError('Parent record no longer exists', 404);
            user = { _id: phone, phone, email: student.parentEmail, role: 'parent', schoolId: student.schoolId };
        }

        await PhoneAuth.deleteOne({ _id: auth._id });

        return user;
    }

    async loginSchool(email, password, otp) {
        // ... (existing code, unchanged logic)
        const school = await SchoolRepository.model.findOne({ email }).select('+password +otp +otpExpires');
        if (!school || school.password !== password) {
            throw new AppError('Incorrect email or password', 400);
        }
        return school;
    }

    async loginDriverEmail(email, password) {
        const driver = await DriverRepository.model.findOne({ email }).select('+password').populate('schoolId', 'name email address phone');
        if (!driver || driver.password !== password) {
            throw new AppError('Incorrect email or password', 400);
        }
        return driver;
    }

    async loginParentEmail(email, password) {
        const student = await StudentRepository.model.findOne({ parentEmail: email }).select('+parentPassword').populate('schoolId', 'name email address phone');
        if (!student || student.parentPassword !== password) {
            throw new AppError('Incorrect email or password', 400);
        }
        return { _id: student.parentPhone, phone: student.parentPhone, email: email, role: 'parent', schoolId: student.schoolId };
    }

    // Deprecated in favor of new verifyOtp flow but keeping for compatibility if needed
    async loginDriver(phone, otp) {
        return await this.verifyOtp(phone, 'driver', otp);
    }

    async loginParent(phone, otp) {
        return await this.verifyOtp(phone, 'parent', otp);
    }

    async changePassword(userId, role, currentPassword, newPassword) {
        if (role === 'school') {
            const school = await SchoolRepository.model.findById(userId).select('+password');
            if (!school || school.password !== currentPassword) {
                throw new AppError('Incorrect current password', 400);
            }
            school.password = newPassword;
            await school.save();
        } else if (role === 'driver') {
            const driver = await DriverRepository.model.findById(userId).select('+password');
            if (!driver || driver.password !== currentPassword) {
                throw new AppError('Incorrect current password', 400);
            }
            driver.password = newPassword;
            await driver.save();
        } else if (role === 'parent') {
            const student = await StudentRepository.model.findOne({ parentPhone: userId }).select('+parentPassword');
            if (!student || student.parentPassword !== currentPassword) {
                throw new AppError('Incorrect current password', 400);
            }
            await StudentRepository.model.updateMany(
                { parentPhone: userId },
                { parentPassword: newPassword }
            );
        } else {
            throw new AppError('Password change not supported for this role', 400);
        }
    }
}

module.exports = new AuthService();
