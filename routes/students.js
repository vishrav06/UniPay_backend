const express = require('express');
const router = express.Router();
const studentController = require('../controllers/studentController');

router.get('/:registration_number', studentController.getProfile);
router.get('/:registration_number/monthly-spending', studentController.getMonthlySpending);

module.exports = router;
