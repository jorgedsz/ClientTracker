const whatsappService = require('../services/whatsappService');

const getStatus = async (req, res) => {
  try {
    const status = await whatsappService.getStatus();
    res.json(status);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const getQr = async (req, res) => {
  try {
    const qr = whatsappService.getQrCode();
    res.json({ qr: qr || null });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const connect = async (req, res) => {
  try {
    const result = await whatsappService.initialize(req.prisma);
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const disconnect = async (req, res) => {
  try {
    const result = await whatsappService.disconnect();
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const getGroups = async (req, res) => {
  try {
    const groups = await whatsappService.getGroups();
    res.json(groups);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const getMessages = async (req, res) => {
  try {
    const { clientId, groupId } = req.query;

    const where = {};
    if (clientId) {
      where.clientId = clientId;
    }
    if (groupId) {
      where.groupId = groupId;
    }

    const messages = await req.prisma.whatsAppMessage.findMany({
      where,
      include: {
        client: true,
      },
      orderBy: { timestamp: 'desc' },
      take: 100,
    });

    res.json(messages);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const flagMessage = async (req, res) => {
  try {
    const { id } = req.params;

    const message = await req.prisma.whatsAppMessage.findUnique({
      where: { id },
    });

    if (!message) {
      return res.status(404).json({ error: 'Message not found' });
    }

    const updated = await req.prisma.whatsAppMessage.update({
      where: { id },
      data: { isRequest: !message.isRequest },
    });

    res.json(updated);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const noteMessage = async (req, res) => {
  try {
    const { id } = req.params;
    const { requestNote } = req.body;

    const updated = await req.prisma.whatsAppMessage.update({
      where: { id },
      data: { requestNote },
    });

    res.json(updated);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

module.exports = {
  getStatus,
  getQr,
  connect,
  disconnect,
  getGroups,
  getMessages,
  flagMessage,
  noteMessage,
};
