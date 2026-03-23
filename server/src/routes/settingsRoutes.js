const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/settingsController');

router.get('/', ctrl.getSettings);
router.put('/', ctrl.updateSettings);
router.get('/health', ctrl.healthCheck);

module.exports = router;
