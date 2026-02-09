const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');

router.get('/students/monthly-spending', adminController.getAllStudentsSpending);
router.get('/vendors/monthly-earnings', adminController.getAllVendorsEarnings);

module.exports = router;
