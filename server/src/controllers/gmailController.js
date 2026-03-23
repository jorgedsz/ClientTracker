const gmailService = require('../services/gmailService');
const gmailPoller = require('../services/gmailPoller');
const encryption = require('../utils/encryption');

const getAuthUrl = async (req, res) => {
  try {
    const url = gmailService.getAuthUrl();
    res.json({ url });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const oauthCallback = async (req, res) => {
  try {
    const { code } = req.query;

    if (!code) {
      return res.status(400).json({ error: 'Authorization code is required' });
    }

    // handleCallback stores tokens and returns { email }
    await gmailService.handleCallback(code);

    const baseUrl = process.env.APP_URL || `${req.protocol}://${req.get('host')}`;
    res.redirect(`${baseUrl}/dashboard/gmail?connected=true`);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const getStatus = async (req, res) => {
  try {
    const connectedSetting = await req.prisma.appSettings.findUnique({
      where: { key: 'gmail_connected' },
    });

    const emailSetting = await req.prisma.appSettings.findUnique({
      where: { key: 'gmail_email' },
    });

    res.json({
      gmail_connected: connectedSetting?.value === 'true',
      gmail_email: emailSetting?.value || null,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const disconnect = async (req, res) => {
  try {
    const keysToRemove = [
      'gmail_access_token',
      'gmail_refresh_token',
      'gmail_connected',
      'gmail_email',
    ];

    for (const key of keysToRemove) {
      await req.prisma.appSettings.deleteMany({
        where: { key },
      });
    }

    res.json({ message: 'Gmail disconnected successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const pollNow = async (req, res) => {
  try {
    const result = await gmailPoller.pollNow();
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const getRecentEmails = async (req, res) => {
  try {
    const emails = await gmailService.getRecentEmails();
    res.json(emails);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

module.exports = {
  getAuthUrl,
  oauthCallback,
  getStatus,
  disconnect,
  pollNow,
  getRecentEmails,
};
