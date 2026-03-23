const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/dashboardController');

router.get('/overview', ctrl.getOverview);
router.get('/recent-activity', ctrl.getRecentActivity);

module.exports = router;
