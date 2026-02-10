const express = require('express');
const router = express.Router();
const vendorController = require('../controllers/vendorController');

router.get('/:vendorid', vendorController.getProfile);
router.get('/:vendorid/monthly-earnings', vendorController.getMonthlyEarnings);
router.get('/:vendorid/today-revenue', vendorController.getTodayRevenue);
router.get('/:vendorid/weekly-revenue', vendorController.getWeeklyRevenue);
router.get('/:vendorid/monthly-stats', vendorController.getMonthlyStats);
router.get('/:vendorid/transactions', vendorController.getTransactionHistory);

module.exports = router;
