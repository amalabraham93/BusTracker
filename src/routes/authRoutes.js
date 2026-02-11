const express = require('express');
const authController = require('../controllers/authController');
const validate = require('../middleware/validateMiddleware');
const { body } = require('express-validator');

const router = express.Router();

router.post('/school/login', [
    body('email').isEmail().withMessage('Please provide a valid email'),
    body('password').exists().withMessage('Password is required'),
    validate
], authController.loginSchool);

router.post('/driver/login', [
    body('phone').exists().withMessage('Phone is required'),
    body('otp').exists().withMessage('OTP is required'),
    validate
], authController.loginDriver);

router.post('/parent/login', [
    body('phone').exists().withMessage('Phone is required'),
    body('otp').exists().withMessage('OTP is required'),
    validate
], authController.loginParent);

module.exports = router;
