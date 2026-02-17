const express = require('express');
const driverController = require('../controllers/driverController');
const authController = require('../controllers/authController');
const authMiddleware = require('../middleware/authMiddleware');
const validate = require('../middleware/validateMiddleware');
const { body } = require('express-validator');

const router = express.Router();

// Public routes (Login)
// Note: Login is handled in authRoutes already, but if we want specific driver routes here:
// router.post('/login', authController.loginDriver);

// Protected Routes
router.use(authMiddleware.protect);
router.use(authMiddleware.restrictTo('driver'));

router.post('/trip/start', [
    body('busId').exists(),
    body('routeId').exists(),
    body('schoolId').exists(),
    validate
], driverController.startTrip);

router.patch('/trip/location', [
    body('lat').isNumeric(),
    body('lng').isNumeric(),
    validate
], driverController.updateLocation);

router.post('/attendance', [
    body('studentId').exists(),
    body('status').isIn(['Boarded', 'Dropped', 'Absent']),
    validate
], driverController.markAttendance);

// Dashboard
router.get('/dashboard', driverController.getDashboard);

module.exports = router;
