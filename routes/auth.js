const express = require('express');
const router = express.Router();
const { login, register } = require('../controllers/authController');

// POST /api/auth/login - User login
router.post('/login', login);

// POST /api/auth/register - User registration
router.post('/register', register);

module.exports = router;
