const { google } = require('googleapis');
const { PrismaClient } = require('@prisma/client');
const { encrypt, decrypt } = require('../utils/encryption');

const prisma = new PrismaClient();

function getOAuth2Client() {
  return new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    process.env.GOOGLE_REDIRECT_URI
  );
}

async function getAuthUrl() {
  const oauth2Client = getOAuth2Client();
  return oauth2Client.generateAuthUrl({
    access_type: 'offline',
    prompt: 'consent',
    scope: [
      'https://www.googleapis.com/auth/gmail.readonly',
      'https://www.googleapis.com/auth/gmail.labels',
      'https://mail.google.com/',
    ],
  });
}

async function handleCallback(code) {
  const oauth2Client = getOAuth2Client();
  const { tokens } = await oauth2Client.getToken(code);

  // Store tokens encrypted
  await setSetting('gmail_access_token', encrypt(tokens.access_token));
  await setSetting('gmail_refresh_token', encrypt(tokens.refresh_token || ''));
  await setSetting('gmail_token_expiry', tokens.expiry_date?.toString() || '');
  await setSetting('gmail_connected', 'true');

  // Get user email
  oauth2Client.setCredentials(tokens);
  const gmail = google.gmail({ version: 'v1', auth: oauth2Client });
  const profile = await gmail.users.getProfile({ userId: 'me' });
  await setSetting('gmail_email', profile.data.emailAddress || '');

  return { email: profile.data.emailAddress };
}

async function getAuthenticatedClient() {
  const accessToken = await getSetting('gmail_access_token');
  const refreshToken = await getSetting('gmail_refresh_token');
  if (!accessToken) throw new Error('Gmail not connected');

  const oauth2Client = getOAuth2Client();
  oauth2Client.setCredentials({
    access_token: decrypt(accessToken),
    refresh_token: refreshToken ? decrypt(refreshToken) : undefined,
  });

  // Handle token refresh
  oauth2Client.on('tokens', async (tokens) => {
    if (tokens.access_token) {
      await setSetting('gmail_access_token', encrypt(tokens.access_token));
    }
    if (tokens.refresh_token) {
      await setSetting('gmail_refresh_token', encrypt(tokens.refresh_token));
    }
  });

  return oauth2Client;
}

async function getRecentEmails(maxResults = 20) {
  const auth = await getAuthenticatedClient();
  const gmail = google.gmail({ version: 'v1', auth });

  const res = await gmail.users.messages.list({
    userId: 'me',
    maxResults,
  });

  if (!res.data.messages) return [];

  const emails = [];
  for (const msg of res.data.messages) {
    const detail = await gmail.users.messages.get({
      userId: 'me',
      id: msg.id,
      format: 'metadata',
      metadataHeaders: ['From', 'Subject', 'Date'],
    });
    const headers = detail.data.payload?.headers || [];
    emails.push({
      id: msg.id,
      from: headers.find(h => h.name === 'From')?.value || '',
      subject: headers.find(h => h.name === 'Subject')?.value || '',
      date: headers.find(h => h.name === 'Date')?.value || '',
      snippet: detail.data.snippet || '',
    });
  }
  return emails;
}

async function getEmailBody(messageId) {
  const auth = await getAuthenticatedClient();
  const gmail = google.gmail({ version: 'v1', auth });

  const detail = await gmail.users.messages.get({
    userId: 'me',
    id: messageId,
    format: 'full',
  });

  function extractText(payload) {
    if (payload.mimeType === 'text/plain' && payload.body?.data) {
      return Buffer.from(payload.body.data, 'base64').toString('utf-8');
    }
    if (payload.parts) {
      for (const part of payload.parts) {
        const text = extractText(part);
        if (text) return text;
      }
    }
    return '';
  }

  return {
    id: detail.data.id,
    headers: detail.data.payload?.headers || [],
    body: extractText(detail.data.payload || {}),
    snippet: detail.data.snippet || '',
  };
}

async function getHistoryId() {
  const auth = await getAuthenticatedClient();
  const gmail = google.gmail({ version: 'v1', auth });
  const profile = await gmail.users.getProfile({ userId: 'me' });
  return profile.data.historyId;
}

async function getMessagesSinceHistory(historyId) {
  const auth = await getAuthenticatedClient();
  const gmail = google.gmail({ version: 'v1', auth });

  try {
    const res = await gmail.users.history.list({
      userId: 'me',
      startHistoryId: historyId,
      historyTypes: ['messageAdded'],
    });

    const messageIds = new Set();
    if (res.data.history) {
      for (const h of res.data.history) {
        if (h.messagesAdded) {
          for (const m of h.messagesAdded) {
            messageIds.add(m.message.id);
          }
        }
      }
    }
    return { messageIds: [...messageIds], newHistoryId: res.data.historyId };
  } catch (err) {
    if (err.code === 404) {
      // historyId too old, do a full re-sync
      return { messageIds: [], newHistoryId: null, needsFullSync: true };
    }
    throw err;
  }
}

// Helper: get/set AppSettings
async function getSetting(key) {
  const row = await prisma.appSettings.findUnique({ where: { key } });
  return row?.value || null;
}

async function setSetting(key, value) {
  await prisma.appSettings.upsert({
    where: { key },
    update: { value },
    create: { key, value },
  });
}

module.exports = {
  getAuthUrl,
  handleCallback,
  getAuthenticatedClient,
  getRecentEmails,
  getEmailBody,
  getHistoryId,
  getMessagesSinceHistory,
  getSetting,
  setSetting,
};
