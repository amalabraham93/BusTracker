const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const SchoolRepository = require('../repositories/SchoolRepository');
const DriverRepository = require('../repositories/DriverRepository');
const PhoneAuth = require('../models/PhoneAuth');
const StudentRepository = require('../repositories/StudentRepository');
const Parent = require('../models/Parent');
const AppError = require('../utils/AppError');
const logger = require('../utils/logger');

class AuthService {
    async compareAndMigratePassword(user, inputPassword, role) {
        const passwordField = role === 'parent' ? 'parentPassword' : 'password';
        const storedPassword = user[passwordField];

        if (!storedPassword) return false;

        const isHash = /^\$2[aby]\$\d{2}\$[./A-Za-z0-9]{53}$/.test(storedPassword);

        if (isHash) {
            return await bcrypt.compare(inputPassword, storedPassword);
        } else {
            // Legacy plain text check
            if (storedPassword === inputPassword) {
                // Migrate to hash immediately
                const hashed = await bcrypt.hash(inputPassword, 12);
                if (role === 'parent') {
                    user[passwordField] = hashed;
                    await user.constructor.updateOne({ _id: user._id }, { [passwordField]: hashed });
                } else {
                    user[passwordField] = hashed;
                    await user.constructor.updateOne({ _id: user._id }, { [passwordField]: hashed });
                }
                return true;
            }
            return false;
        }
    }

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
            const parent = await Parent.findOne({ phone });
            if (!parent) throw new AppError('No parent record found with this phone number', 404);
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
            const parent = await Parent.findOne({ phone });
            if (!parent) throw new AppError('Parent record no longer exists', 404);
            user = { _id: parent._id, phone: parent.phone, email: parent.email, role: 'parent' };
        }

        await PhoneAuth.deleteOne({ _id: auth._id });

        return user;
    }

    async loginSchool(email, password, otp) {
        // ... (existing code, unchanged logic)
        const school = await SchoolRepository.model.findOne({ email }).select('+password +otp +otpExpires');
        if (!school || !(await this.compareAndMigratePassword(school, password, 'school'))) {
            throw new AppError('Incorrect email or password', 400);
        }
        return school;
    }

    async loginDriverEmail(email, password) {
        const driver = await DriverRepository.model.findOne({ email }).select('+password').populate('schoolId', 'name email address phone');
        if (!driver || !(await this.compareAndMigratePassword(driver, password, 'driver'))) {
            throw new AppError('Incorrect email or password', 400);
        }
        return driver;
    }

    async loginParentEmail(email, password) {
        const parent = await Parent.findOne({ email }).select('+password');
        if (!parent || !(await this.compareAndMigratePassword(parent, password, 'parent'))) {
            throw new AppError('Incorrect email or password', 400);
        }
        return { _id: parent._id, phone: parent.phone, email: parent.email, role: 'parent' };
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
            if (!school || !(await this.compareAndMigratePassword(school, currentPassword, 'school'))) {
                throw new AppError('Incorrect current password', 400);
            }
            school.password = newPassword;
            await school.save(); // triggers pre-save hook
        } else if (role === 'driver') {
            const driver = await DriverRepository.model.findById(userId).select('+password');
            if (!driver || !(await this.compareAndMigratePassword(driver, currentPassword, 'driver'))) {
                throw new AppError('Incorrect current password', 400);
            }
            driver.password = newPassword;
            await driver.save(); // triggers pre-save hook
        } else if (role === 'parent') {
            const parent = await Parent.findById(userId).select('+password');
            if (!parent || !(await this.compareAndMigratePassword(parent, currentPassword, 'parent'))) {
                throw new AppError('Incorrect current password', 400);
            }
            parent.password = newPassword;
            await parent.save(); // triggers pre-save hook
        } else {
            throw new AppError('Password change not supported for this role', 400);
        }
    }
}

module.exports = new AuthService();
