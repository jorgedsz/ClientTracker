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

    const tokens = await gmailService.handleCallback(code);

    // Store tokens encrypted in AppSettings
    const tokenEntries = [
      { key: 'gmail_access_token', value: encryption.encrypt(tokens.access_token) },
      { key: 'gmail_refresh_token', value: encryption.encrypt(tokens.refresh_token) },
      { key: 'gmail_connected', value: 'true' },
    ];

    if (tokens.email) {
      tokenEntries.push({ key: 'gmail_email', value: tokens.email });
    }

    for (const entry of tokenEntries) {
      await req.prisma.appSettings.upsert({
        where: { key: entry.key },
        update: { value: entry.value },
        create: { key: entry.key, value: entry.value },
      });
    }

    res.redirect('http://localhost:5174/dashboard/gmail?connected=true');
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
