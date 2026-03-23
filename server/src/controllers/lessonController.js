const openaiService = require('../services/openaiService');

const getLessons = async (req, res) => {
  try {
    const { clientId } = req.query;

    const where = {};
    if (clientId) {
      where.clientId = clientId;
    }

    const lessons = await req.prisma.lesson.findMany({
      where,
      include: {
        meeting: true,
        client: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    res.json(lessons);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const getLesson = async (req, res) => {
  try {
    const { id } = req.params;

    const lesson = await req.prisma.lesson.findUnique({
      where: { id },
      include: {
        meeting: true,
        client: true,
      },
    });

    if (!lesson) {
      return res.status(404).json({ error: 'Lesson not found' });
    }

    res.json(lesson);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const updateLesson = async (req, res) => {
  try {
    const { id } = req.params;
    const { title, summary, keyTakeaways, actionItems } = req.body;

    const lesson = await req.prisma.lesson.update({
      where: { id },
      data: { title, summary, keyTakeaways, actionItems },
    });

    res.json(lesson);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const deleteLesson = async (req, res) => {
  try {
    const { id } = req.params;

    await req.prisma.lesson.delete({
      where: { id },
    });

    res.json({ message: 'Lesson deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const regenerateLesson = async (req, res) => {
  try {
    const { id } = req.params;

    const lesson = await req.prisma.lesson.findUnique({
      where: { id },
      include: { meeting: true },
    });

    if (!lesson) {
      return res.status(404).json({ error: 'Lesson not found' });
    }

    if (!lesson.meeting || !lesson.meeting.transcriptionText) {
      return res.status(400).json({ error: 'Associated meeting has no transcription text' });
    }

    const lessonData = await openaiService.generateLessonFromTranscription(lesson.meeting.transcriptionText);

    const updatedLesson = await req.prisma.lesson.update({
      where: { id },
      data: {
        title: lessonData.title,
        summary: lessonData.summary,
        keyTakeaways: lessonData.keyTakeaways,
        actionItems: lessonData.actionItems,
      },
    });

    res.json(updatedLesson);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

module.exports = {
  getLessons,
  getLesson,
  updateLesson,
  deleteLesson,
  regenerateLesson,
};
