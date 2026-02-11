const express = require('express');
const authController = require('../controllers/authController');
const validate = require('../middleware/validateMiddleware');
const { body } = require('express-validator');

const router = express.Router();

router.post('/login', [
    body('role').isIn(['admin', 'school', 'driver', 'parent']).withMessage('Invalid role'),
    // Conditional validation is hard with static express-validator middleware here
    // heavily relying on controller check or custom validator.
    // Let's keep basic check that role exists. Controller checks specific fields.
    validate
], authController.login);

module.exports = router;
