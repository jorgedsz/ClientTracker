const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/lessonController');

router.get('/', ctrl.getLessons);
router.get('/:id', ctrl.getLesson);
router.put('/:id', ctrl.updateLesson);
router.delete('/:id', ctrl.deleteLesson);
router.post('/:id/regenerate', ctrl.regenerateLesson);

module.exports = router;
