const express = require('express');
const adminController = require('../controllers/adminController');
const authMiddleware = require('../middleware/authMiddleware');
const validate = require('../middleware/validateMiddleware');
const { body } = require('express-validator');

const router = express.Router();

router.use(authMiddleware.protect);
router.use(authMiddleware.restrictTo('admin'));

router.post('/schools', [
    body('name').exists().withMessage('School name is required'),
    body('email').isEmail().withMessage('Valid email is required'),
    body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
    body('address').exists().withMessage('Address is required'),
    validate
], adminController.createSchool);

router.get('/dashboard', adminController.getDashboardStats);
router.get('/live-tracking', adminController.getLiveTracking);
router.get('/attendance', adminController.getAllAttendance);

module.exports = router;
