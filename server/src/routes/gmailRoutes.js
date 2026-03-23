const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/gmailController');

router.get('/auth-url', ctrl.getAuthUrl);
router.get('/oauth/callback', ctrl.oauthCallback);
router.get('/status', ctrl.getStatus);
router.post('/disconnect', ctrl.disconnect);
router.post('/poll-now', ctrl.pollNow);
router.get('/recent-emails', ctrl.getRecentEmails);

module.exports = router;
