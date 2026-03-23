const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/emailFilterController');

router.get('/', ctrl.getFilters);
router.post('/', ctrl.createFilter);
router.put('/:id', ctrl.updateFilter);
router.delete('/:id', ctrl.deleteFilter);
router.post('/test', ctrl.testFilter);

module.exports = router;
