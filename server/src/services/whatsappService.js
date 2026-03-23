let Client, LocalAuth;
try {
  const wwebjs = require('whatsapp-web.js');
  Client = wwebjs.Client;
  LocalAuth = wwebjs.LocalAuth;
} catch {
  console.warn('whatsapp-web.js not available - WhatsApp features disabled');
}
const qrcode = require('qrcode');

let client = null;
let currentQr = null;
let status = 'disconnected'; // disconnected, qr_pending, connected
let prismaRef = null;

const REQUEST_KEYWORDS = [
  'can you', 'could you', 'i need', 'please send', 'please share',
  'would you', 'i want', 'send me', 'help me', 'i\'d like',
  'requesting', 'request for', 'need help', 'assist me',
];

function getStatus() {
  return { status, qrAvailable: !!currentQr };
}

function getQrCode() {
  return currentQr;
}

async function initialize(prisma) {
  if (!Client) {
    throw new Error('WhatsApp is not available in this environment');
  }
  if (client) {
    await disconnect();
  }

  prismaRef = prisma;
  status = 'qr_pending';
  currentQr = null;

  client = new Client({
    authStrategy: new LocalAuth({ dataPath: '.wwebjs_auth' }),
    puppeteer: {
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
    },
  });

  client.on('qr', async (qr) => {
    currentQr = await qrcode.toDataURL(qr);
    status = 'qr_pending';
    console.log('WhatsApp QR code generated');
  });

  client.on('ready', () => {
    status = 'connected';
    currentQr = null;
    console.log('WhatsApp client ready');
  });

  client.on('disconnected', () => {
    status = 'disconnected';
    currentQr = null;
    client = null;
    console.log('WhatsApp disconnected');
  });

  client.on('message', async (msg) => {
    try {
      await handleMessage(msg);
    } catch (err) {
      console.error('WhatsApp message handler error:', err.message);
    }
  });

  await client.initialize();
  return { status };
}

async function handleMessage(msg) {
  if (!prismaRef) return;

  const chat = await msg.getChat();
  if (!chat.isGroup) return;

  // Check if this group is linked to a client
  const linkedClient = await prismaRef.client.findFirst({
    where: { whatsappGroupId: chat.id._serialized },
  });

  // Only log messages from linked groups
  if (!linkedClient) return;

  const contact = await msg.getContact();
  const messageText = msg.body || '';

  // Check for request keywords
  const isRequest = REQUEST_KEYWORDS.some(kw =>
    messageText.toLowerCase().includes(kw)
  );

  await prismaRef.whatsAppMessage.create({
    data: {
      clientId: linkedClient.id,
      groupId: chat.id._serialized,
      groupName: chat.name,
      sender: contact.pushname || contact.name || 'Unknown',
      senderNumber: contact.number || null,
      message: messageText,
      timestamp: new Date(msg.timestamp * 1000),
      isRequest,
    },
  });
}

async function disconnect() {
  if (client) {
    try {
      await client.destroy();
    } catch {}
    client = null;
  }
  status = 'disconnected';
  currentQr = null;
  return { status };
}

async function getGroups() {
  if (!client || status !== 'connected') {
    return [];
  }

  const chats = await client.getChats();
  return chats
    .filter(chat => chat.isGroup)
    .map(chat => ({
      id: chat.id._serialized,
      name: chat.name,
      participantCount: chat.participants?.length || 0,
    }));
}

module.exports = {
  getStatus,
  getQrCode,
  initialize,
  disconnect,
  getGroups,
};
