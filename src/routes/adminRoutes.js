const express = require('express');
const adminController = require('../controllers/adminController');
const authMiddleware = require('../middleware/authMiddleware');
const validate = require('../middleware/validateMiddleware');
const { body } = require('express-validator');

const router = express.Router();

router.use(authMiddleware.protect);
router.use(authMiddleware.restrictTo('admin'));

// --- DASHBOARD & LIVE ---
router.get('/dashboard', adminController.getDashboardStats);
router.get('/live-tracking', adminController.getLiveTracking);
router.get('/attendance', adminController.getAllAttendance);

// --- SCHOOL MANAGEMENT ---
router.get('/schools', adminController.getSchools);
router.post('/schools', [
    body('name').exists().withMessage('School name is required'),
    body('email').isEmail().withMessage('Valid email is required'),
    body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
    body('address').exists().withMessage('Address is required'),
    validate
], adminController.createSchool);
router.patch('/schools/:id', adminController.updateSchool);
router.delete('/schools/:id', adminController.deleteSchool);

// --- BUS MANAGEMENT ---
router.get('/buses', adminController.getBuses);
router.post('/buses', [
    body('busNumber').exists().withMessage('Bus number is required'),
    body('capacity').isNumeric().withMessage('Capacity must be a number'),
    body('schoolId').isMongoId().withMessage('Valid School ID is required'),
    validate
], adminController.createBus);
router.patch('/buses/:id', adminController.updateBus);
router.delete('/buses/:id', adminController.deleteBus);

// --- ROUTE MANAGEMENT ---
router.get('/routes', adminController.getRoutes);
router.post('/routes', [
    body('routeName').exists().withMessage('Route name is required'),
    body('schoolId').isMongoId().withMessage('Valid School ID is required'),
    validate
], adminController.createRoute);
router.patch('/routes/:id', adminController.updateRoute);
router.delete('/routes/:id', adminController.deleteRoute);

// --- STUDENT MANAGEMENT ---
router.get('/students', adminController.getStudents);
router.post('/students', [
    body('name').exists().withMessage('Student name is required'),
    body('studentRollId').exists().withMessage('Student Roll ID is required'),
    body('classGrade').exists().withMessage('Class/Grade is required'),
    body('section').exists().withMessage('Section is required'),
    body('parentPhone').exists().withMessage('Parent phone is required'),
    body('schoolId').isMongoId().withMessage('Valid School ID is required'),
    validate
], adminController.createStudent);
router.patch('/students/:id', adminController.updateStudent);
router.delete('/students/:id', adminController.deleteStudent);

module.exports = router;
