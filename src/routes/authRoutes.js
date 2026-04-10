const express = require('express');
const authController = require('../controllers/authController');
const validate = require('../middleware/validateMiddleware');
const { body } = require('express-validator');

const router = express.Router();

router.post('/login', [
    body('role').isIn(['admin', 'school', 'driver', 'parent']).withMessage('Invalid role'),
    validate
], (authController.login));

router.post('/send-otp', [
    body('phone').notEmpty().withMessage('Phone is required'),
    body('role').isIn(['driver', 'parent']).withMessage('Invalid role for OTP'),
    validate
], authController.requestOtp);

router.post('/verify-otp', [
    body('phone').notEmpty().withMessage('Phone is required'),
    body('otp').notEmpty().withMessage('OTP is required'),
    body('role').isIn(['driver', 'parent']).withMessage('Invalid role'),
    validate
], authController.verifyOtp);

router.post('/logout', authController.logout);

module.exports = router;
