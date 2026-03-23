const getOverview = async (req, res) => {
  try {
    const totalClients = await req.prisma.client.count();

    const activeClients = await req.prisma.client.count({
      where: { status: 'active' },
    });

    const totalLessons = await req.prisma.lesson.count();

    // Meetings this month
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);

    const meetingsThisMonth = await req.prisma.meeting.count({
      where: {
        date: {
          gte: startOfMonth,
          lte: endOfMonth,
        },
      },
    });

    // Pending WhatsApp requests
    const pendingRequests = await req.prisma.whatsAppMessage.count({
      where: { isRequest: true },
    });

    // Gmail connected status
    const gmailSetting = await req.prisma.appSettings.findUnique({
      where: { key: 'gmail_connected' },
    });
    const gmailConnected = gmailSetting?.value === 'true';

    // WhatsApp connected status
    let whatsappConnected = false;
    try {
      const whatsappService = require('../services/whatsappService');
      const waStatus = await whatsappService.getStatus();
      whatsappConnected = waStatus.status === 'connected';
    } catch {
      whatsappConnected = false;
    }

    res.json({
      totalClients,
      activeClients,
      totalLessons,
      meetingsThisMonth,
      pendingRequests,
      gmailConnected,
      whatsappConnected,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const getRecentActivity = async (req, res) => {
  try {
    const recentLessons = await req.prisma.lesson.findMany({
      take: 10,
      orderBy: { createdAt: 'desc' },
      include: {
        client: { select: { id: true, name: true } },
        meeting: { select: { id: true, title: true } },
      },
    });

    const recentFlaggedMessages = await req.prisma.whatsAppMessage.findMany({
      where: { isRequest: true },
      take: 10,
      orderBy: { timestamp: 'desc' },
      include: {
        client: { select: { id: true, name: true } },
      },
    });

    // Normalize and merge activities
    const activities = [
      ...recentLessons.map((lesson) => ({
        type: 'lesson',
        id: lesson.id,
        title: lesson.title,
        client: lesson.client,
        meeting: lesson.meeting,
        date: lesson.createdAt,
      })),
      ...recentFlaggedMessages.map((msg) => ({
        type: 'whatsapp_request',
        id: msg.id,
        body: msg.body,
        sender: msg.sender,
        client: msg.client,
        date: msg.timestamp,
      })),
    ];

    // Sort by date descending
    activities.sort((a, b) => new Date(b.date) - new Date(a.date));

    res.json(activities);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

module.exports = {
  getOverview,
  getRecentActivity,
};
