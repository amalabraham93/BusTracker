const express = require('express');
const schoolController = require('../controllers/schoolController');
const authMiddleware = require('../middleware/authMiddleware');

const router = express.Router();

router.use(authMiddleware.protect);
router.use(authMiddleware.restrictTo('school'));

router.post('/drivers', schoolController.createDriver);
router.post('/buses', schoolController.createBus);
router.post('/routes', schoolController.createRoute);
router.post('/students', schoolController.createStudent);
router.get('/dashboard', schoolController.getDashboard);

module.exports = router;
