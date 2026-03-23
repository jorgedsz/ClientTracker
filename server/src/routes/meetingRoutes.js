const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/meetingController');

router.get('/', ctrl.getMeetings);
router.get('/:id', ctrl.getMeeting);
router.post('/', ctrl.createMeeting);
router.put('/:id', ctrl.updateMeeting);
router.delete('/:id', ctrl.deleteMeeting);
router.post('/:id/generate-lesson', ctrl.generateLesson);

module.exports = router;
