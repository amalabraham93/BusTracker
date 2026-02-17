const express = require('express');
const schoolController = require('../controllers/schoolController');
const authMiddleware = require('../middleware/authMiddleware');

const router = express.Router();

router.use(authMiddleware.protect);
router.use(authMiddleware.restrictTo('school'));

router.post('/drivers', schoolController.createDriver);
router.get('/drivers', schoolController.getDrivers);

router.post('/buses', schoolController.createBus);
router.get('/buses', schoolController.getBuses);

router.post('/routes', schoolController.createRoute);
router.get('/routes', schoolController.getRoutes);

router.post('/students', schoolController.createStudent);
router.get('/students', schoolController.getStudents);

router.get('/dashboard', schoolController.getDashboardStats);
router.get('/attendance', schoolController.getAttendance);
router.get('/live-tracking', schoolController.getLiveTracking);

module.exports = router;
