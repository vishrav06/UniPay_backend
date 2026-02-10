const express = require('express');
const router = express.Router();
const studentController = require('../controllers/studentController');

router.get('/:registration_number', studentController.getProfile);
router.get('/:registration_number/monthly-spending', studentController.getMonthlySpending);
router.get('/:registration_number/current-month', studentController.getCurrentMonthSpending);
router.get('/:registration_number/weekly-spending', studentController.getWeeklySpending);
router.get('/:registration_number/daily-spending', studentController.getDailySpending);
router.get('/:registration_number/transactions', studentController.getTransactionHistory);
router.get('/:registration_number/goal', studentController.getGoal);
router.post('/:registration_number/goal', studentController.setGoal);

module.exports = router;
