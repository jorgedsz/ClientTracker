const encryption = require('../utils/encryption');

const SENSITIVE_KEYS = [
  'gmail_access_token',
  'gmail_refresh_token',
  'openai_api_key',
  'google_client_secret',
];

const isSensitiveKey = (key) => {
  const lowerKey = key.toLowerCase();
  return (
    SENSITIVE_KEYS.includes(key) ||
    lowerKey.includes('token') ||
    lowerKey.includes('key') ||
    lowerKey.includes('secret')
  );
};

const getSettings = async (req, res) => {
  try {
    const settings = await req.prisma.appSettings.findMany();

    const maskedSettings = settings.map((setting) => {
      if (isSensitiveKey(setting.key) && setting.value) {
        try {
          const decrypted = encryption.decrypt(setting.value);
          return { ...setting, value: encryption.mask(decrypted) };
        } catch {
          // Value might not be encrypted, mask it directly
          return { ...setting, value: encryption.mask(setting.value) };
        }
      }
      return setting;
    });

    res.json(maskedSettings);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const updateSettings = async (req, res) => {
  try {
    const input = req.body;

    // Support both single { key, value } and array of entries
    const entries = Array.isArray(input) ? input : [input];

    const results = [];

    for (const { key, value } of entries) {
      if (!key) {
        continue;
      }

      const storedValue = isSensitiveKey(key) ? encryption.encrypt(value) : value;

      const setting = await req.prisma.appSettings.upsert({
        where: { key },
        update: { value: storedValue },
        create: { key, value: storedValue },
      });

      results.push(setting);
    }

    res.json(results.length === 1 ? results[0] : results);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const healthCheck = async (req, res) => {
  try {
    // Check database connection
    let dbStatus = 'connected';
    try {
      await req.prisma.$queryRaw`SELECT 1`;
    } catch {
      dbStatus = 'disconnected';
    }

    // Check Gmail status
    const gmailSetting = await req.prisma.appSettings.findUnique({
      where: { key: 'gmail_connected' },
    });
    const gmailStatus = gmailSetting?.value === 'true' ? 'connected' : 'disconnected';

    // Check WhatsApp status
    let whatsappStatus = 'disconnected';
    try {
      const whatsappService = require('../services/whatsappService');
      const waStatus = await whatsappService.getStatus();
      whatsappStatus = waStatus.connected ? 'connected' : 'disconnected';
    } catch {
      whatsappStatus = 'disconnected';
    }

    res.json({
      database: dbStatus,
      gmail: gmailStatus,
      whatsapp: whatsappStatus,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

module.exports = {
  getSettings,
  updateSettings,
  healthCheck,
};
