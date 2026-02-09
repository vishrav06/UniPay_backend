const express = require('express');
const router = express.Router();
const vendorController = require('../controllers/vendorController');

router.get('/:vendorid', vendorController.getProfile);
router.get('/:vendorid/monthly-earnings', vendorController.getMonthlyEarnings);

module.exports = router;
