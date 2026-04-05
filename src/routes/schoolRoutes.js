const express = require('express');
const schoolController = require('../controllers/schoolController');
const authMiddleware = require('../middleware/authMiddleware');
const validate = require('../middleware/validateMiddleware');
const { body } = require('express-validator');

const router = express.Router();

router.use(authMiddleware.protect);
router.use(authMiddleware.restrictTo('school'));

// --- BUS MANAGEMENT ---
router.get('/buses', schoolController.getBuses);
router.post('/buses', [
    body('busNumber').exists().withMessage('Bus number is required'),
    body('capacity').isNumeric().withMessage('Capacity must be a number'),
    validate
], schoolController.createBus);
router.patch('/buses/:id', schoolController.updateBus);
router.delete('/buses/:id', schoolController.deleteBus);

// --- ROUTE MANAGEMENT ---
router.get('/routes', schoolController.getRoutes);
router.post('/routes', [
    body('routeName').exists().withMessage('Route name is required'),
    validate
], schoolController.createRoute);
router.patch('/routes/:id', schoolController.updateRoute);
router.delete('/routes/:id', schoolController.deleteRoute);

// --- DRIVER MANAGEMENT ---
router.get('/drivers', schoolController.getDrivers);
router.post('/drivers', [
    body('name').exists().withMessage('Driver name is required'),
    body('phone').exists().withMessage('Phone number is required'),
    body('licenseNumber').exists().withMessage('License number is required'),
    validate
], schoolController.createDriver);
router.patch('/drivers/:id', schoolController.updateDriver);
router.delete('/drivers/:id', schoolController.deleteDriver);

// --- STUDENT MANAGEMENT ---
router.get('/students', schoolController.getStudents);
router.post('/students', [
    body('name').exists().withMessage('Student name is required'),
    body('studentRollId').exists().withMessage('Student Roll ID is required'),
    body('classGrade').exists().withMessage('Class/Grade is required'),
    body('section').exists().withMessage('Section is required'),
    body('parentPhone').exists().withMessage('Parent phone is required'),
    validate
], schoolController.createStudent);
router.patch('/students/:id', schoolController.updateStudent);
router.delete('/students/:id', schoolController.deleteStudent);

// --- DASHBOARD & REPORTS ---
router.get('/dashboard', schoolController.getDashboardStats);
router.get('/attendance', schoolController.getAttendance);
router.get('/live-tracking', schoolController.getLiveTracking);

module.exports = router;
