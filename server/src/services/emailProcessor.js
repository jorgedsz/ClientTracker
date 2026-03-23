const openaiService = require('./openaiService');

async function processEmail(emailData, prisma) {
  const { id: messageId, headers, body } = emailData;

  // Check idempotency
  const existing = await prisma.meeting.findUnique({
    where: { sourceEmailId: messageId },
  });
  if (existing) return { skipped: true, reason: 'Already processed' };

  // Get active filters
  const filters = await prisma.emailFilter.findMany({
    where: { isActive: true },
  });

  const from = headers.find(h => h.name === 'From')?.value || '';
  const subject = headers.find(h => h.name === 'Subject')?.value || '';
  const date = headers.find(h => h.name === 'Date')?.value || '';

  // Check if email matches any filter
  let matched = false;
  let matchedFilter = null;
  for (const filter of filters) {
    if (matchesFilter(filter, from, subject, body)) {
      matched = true;
      matchedFilter = filter;
      break;
    }
  }

  if (!matched) return { skipped: true, reason: 'No filter match' };

  // Match to client by email
  const senderEmail = extractEmail(from);
  let client = null;
  if (senderEmail) {
    client = await prisma.client.findUnique({ where: { email: senderEmail } });
  }

  // Also try matching by name in subject
  if (!client) {
    const clients = await prisma.client.findMany({ where: { status: 'active' } });
    for (const c of clients) {
      if (subject.toLowerCase().includes(c.name.toLowerCase())) {
        client = c;
        break;
      }
    }
  }

  if (!client) return { skipped: true, reason: 'No matching client' };

  // Extract transcription based on filter type
  let transcription = '';
  if (matchedFilter.extractionType === 'body') {
    transcription = body;
  } else if (matchedFilter.extractionType === 'link') {
    // Extract first URL from body
    const urlMatch = body.match(/https?:\/\/[^\s<>"]+/);
    transcription = urlMatch ? `[Recording link: ${urlMatch[0]}]\n\n${body}` : body;
  } else {
    transcription = body;
  }

  // Create meeting
  const meeting = await prisma.meeting.create({
    data: {
      clientId: client.id,
      title: subject || 'Untitled Meeting',
      date: date ? new Date(date) : new Date(),
      transcriptionText: transcription,
      sourceEmailId: messageId,
      rawEmailData: JSON.stringify({ from, subject, date, filterName: matchedFilter.name }),
    },
  });

  // Generate lesson via OpenAI
  try {
    const lessonData = await openaiService.generateLessonFromTranscription(
      transcription,
      client.name,
      meeting.date
    );

    await prisma.lesson.create({
      data: {
        clientId: client.id,
        meetingId: meeting.id,
        title: lessonData.title,
        summary: lessonData.summary,
        keyTakeaways: JSON.stringify(lessonData.keyTakeaways),
        actionItems: JSON.stringify(lessonData.actionItems),
        rawAiResponse: JSON.stringify(lessonData),
        status: 'completed',
      },
    });
  } catch (err) {
    console.error('Lesson generation failed:', err.message);
    await prisma.lesson.create({
      data: {
        clientId: client.id,
        meetingId: meeting.id,
        title: 'Generation Failed',
        summary: `Error: ${err.message}`,
        keyTakeaways: '[]',
        actionItems: '[]',
        status: 'failed',
      },
    });
  }

  return { processed: true, meetingId: meeting.id, clientId: client.id };
}

function matchesFilter(filter, from, subject, body) {
  try {
    if (filter.senderPattern) {
      const regex = new RegExp(filter.senderPattern, 'i');
      if (!regex.test(from)) return false;
    }
    if (filter.subjectPattern) {
      const regex = new RegExp(filter.subjectPattern, 'i');
      if (!regex.test(subject)) return false;
    }
    if (filter.contentPattern) {
      const regex = new RegExp(filter.contentPattern, 'i');
      if (!regex.test(body)) return false;
    }
    return true;
  } catch {
    return false;
  }
}

function extractEmail(fromHeader) {
  const match = fromHeader.match(/<([^>]+)>/);
  if (match) return match[1].toLowerCase();
  if (fromHeader.includes('@')) return fromHeader.trim().toLowerCase();
  return null;
}

async function testFilterAgainstEmails(filter, emails) {
  return emails.filter(email =>
    matchesFilter(filter, email.from, email.subject, email.snippet || '')
  );
}

module.exports = { processEmail, testFilterAgainstEmails, matchesFilter };
