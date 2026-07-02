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
router.delete('/buses/:id/hard', schoolController.hardDeleteBus);
router.patch('/buses/:id/restore', schoolController.restoreBus);

// --- ROUTE MANAGEMENT ---
router.get('/routes', schoolController.getRoutes);
router.post('/routes', [
    body('routeName').exists().withMessage('Route name is required'),
    validate
], schoolController.createRoute);
router.patch('/routes/:id', schoolController.updateRoute);
router.delete('/routes/:id', schoolController.deleteRoute);
router.delete('/routes/:id/hard', schoolController.hardDeleteRoute);
router.patch('/routes/:id/restore', schoolController.restoreRoute);
router.get('/routes/:routeId/buses', schoolController.getBusesByRoute);

// --- DRIVER MANAGEMENT ---
router.get('/drivers', schoolController.getDrivers);
router.post('/drivers', [
    body('name').exists().withMessage('Driver name is required'),
    body('phone').exists().withMessage('Phone number is required'),
    body('licenseNumber').exists().withMessage('License number is required'),
    body('password').exists().withMessage('Password is required'),
    validate
], schoolController.createDriver);
router.patch('/drivers/:id', schoolController.updateDriver);
router.delete('/drivers/:id', schoolController.deleteDriver);
router.delete('/drivers/:id/hard', schoolController.hardDeleteDriver);
router.patch('/drivers/:id/restore', schoolController.restoreDriver);

// --- PARENT MANAGEMENT ---
router.get('/parents/check', schoolController.checkParentExists);

// --- STUDENT MANAGEMENT ---
router.get('/students', schoolController.getStudents);
router.get('/students/filter', schoolController.getStudentsList);
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
router.delete('/students/:id/hard', schoolController.hardDeleteStudent);
router.patch('/students/:id/restore', schoolController.restoreStudent);
router.get('/students/:id/attendance', schoolController.getStudentAttendance);

// --- DASHBOARD & REPORTS ---
router.get('/dashboard', schoolController.getDashboardStats);
router.get('/attendance', schoolController.getAttendance);
router.get('/live-tracking', schoolController.getLiveTracking);
router.get('/active-trips', schoolController.getActiveTrips);

module.exports = router;
