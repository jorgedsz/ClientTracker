const openaiService = require('../services/openaiService');

const getMeetings = async (req, res) => {
  try {
    const { clientId } = req.query;

    const where = {};
    if (clientId) {
      where.clientId = clientId;
    }

    const meetings = await req.prisma.meeting.findMany({
      where,
      include: {
        client: { select: { id: true, name: true } },
        lesson: true,
      },
      orderBy: { date: 'desc' },
    });

    res.json(meetings);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const getMeeting = async (req, res) => {
  try {
    const { id } = req.params;

    const meeting = await req.prisma.meeting.findUnique({
      where: { id },
      include: {
        lesson: true,
        client: true,
      },
    });

    if (!meeting) {
      return res.status(404).json({ error: 'Meeting not found' });
    }

    res.json(meeting);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const createMeeting = async (req, res) => {
  try {
    const { clientId, title, date, transcriptionText, recordingUrl } = req.body;

    const meeting = await req.prisma.meeting.create({
      data: { clientId, title, date: new Date(date), transcriptionText, recordingUrl },
      include: {
        client: { select: { id: true, name: true } },
      },
    });

    res.status(201).json(meeting);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const updateMeeting = async (req, res) => {
  try {
    const { id } = req.params;
    const { clientId, title, date, transcriptionText, recordingUrl } = req.body;

    const data = { clientId, title, transcriptionText, recordingUrl };
    if (date) {
      data.date = new Date(date);
    }

    const meeting = await req.prisma.meeting.update({
      where: { id },
      data,
    });

    res.json(meeting);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const deleteMeeting = async (req, res) => {
  try {
    const { id } = req.params;

    await req.prisma.meeting.delete({
      where: { id },
    });

    res.json({ message: 'Meeting deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const generateLesson = async (req, res) => {
  try {
    const { id } = req.params;

    const meeting = await req.prisma.meeting.findUnique({
      where: { id },
      include: { lesson: true, client: true },
    });

    if (!meeting) {
      return res.status(404).json({ error: 'Meeting not found' });
    }

    if (!meeting.transcriptionText) {
      return res.status(400).json({ error: 'Meeting has no transcription text' });
    }

    const lessonData = await openaiService.generateLessonFromTranscription(meeting.transcriptionText);

    let lesson;
    if (meeting.lesson) {
      lesson = await req.prisma.lesson.update({
        where: { id: meeting.lesson.id },
        data: {
          title: lessonData.title,
          summary: lessonData.summary,
          keyTakeaways: lessonData.keyTakeaways,
          actionItems: lessonData.actionItems,
        },
      });
    } else {
      lesson = await req.prisma.lesson.create({
        data: {
          meetingId: meeting.id,
          clientId: meeting.clientId,
          title: lessonData.title,
          summary: lessonData.summary,
          keyTakeaways: lessonData.keyTakeaways,
          actionItems: lessonData.actionItems,
        },
      });
    }

    res.json(lesson);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

module.exports = {
  getMeetings,
  getMeeting,
  createMeeting,
  updateMeeting,
  deleteMeeting,
  generateLesson,
};
