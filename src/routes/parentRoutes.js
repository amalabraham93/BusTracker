const express = require('express');
const parentController = require('../controllers/parentController');
const authMiddleware = require('../middleware/authMiddleware');

const router = express.Router();

router.use(authMiddleware.protect);

// Allowed for parents and admins?
router.get('/children', parentController.getChildren);

router.get('/student/:id/activity', parentController.getStudentActivity);
router.get('/student/:id/attendance', parentController.getStudentAttendance);

module.exports = router;
