const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/whatsappController');

router.get('/status', ctrl.getStatus);
router.get('/qr', ctrl.getQr);
router.post('/connect', ctrl.connect);
router.post('/disconnect', ctrl.disconnect);
router.get('/groups', ctrl.getGroups);
router.get('/messages', ctrl.getMessages);
router.patch('/messages/:id/flag', ctrl.flagMessage);
router.patch('/messages/:id/note', ctrl.noteMessage);

module.exports = router;
