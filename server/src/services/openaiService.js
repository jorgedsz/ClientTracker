const OpenAI = require('openai');
const { PrismaClient } = require('@prisma/client');
const { decrypt } = require('../utils/encryption');

const prisma = new PrismaClient();

async function getClient() {
  // First try env var, then try AppSettings
  let apiKey = process.env.OPENAI_API_KEY;

  if (!apiKey) {
    const setting = await prisma.appSettings.findUnique({
      where: { key: 'openai_api_key' },
    });
    if (setting?.value) {
      try {
        apiKey = decrypt(setting.value);
      } catch {
        apiKey = setting.value;
      }
    }
  }

  if (!apiKey) throw new Error('OpenAI API key not configured');
  return new OpenAI({ apiKey });
}

async function generateLessonFromTranscription(transcription, clientName, meetingDate) {
  const openai = await getClient();

  // Get preferred model from settings, default to gpt-4o
  let model = 'gpt-4o';
  const modelSetting = await prisma.appSettings.findUnique({
    where: { key: 'openai_model' },
  });
  if (modelSetting?.value) model = modelSetting.value;

  const dateStr = meetingDate instanceof Date
    ? meetingDate.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })
    : meetingDate;

  const response = await openai.chat.completions.create({
    model,
    messages: [
      {
        role: 'system',
        content: `You are an expert coaching assistant that creates structured lesson summaries from meeting transcriptions.

Given a meeting transcription, generate a structured lesson summary in JSON format with these fields:
- title: A concise, descriptive title for the lesson (max 100 chars)
- summary: A comprehensive paragraph summarizing the key discussion points and outcomes (200-400 words)
- keyTakeaways: An array of 3-7 key takeaway strings, each a complete sentence
- actionItems: An array of specific action items discussed, each a clear task description

Return ONLY valid JSON, no markdown code blocks.`,
      },
      {
        role: 'user',
        content: `Client: ${clientName}
Meeting Date: ${dateStr}

Transcription:
${transcription.substring(0, 15000)}`,
      },
    ],
    temperature: 0.3,
    max_tokens: 2000,
  });

  const content = response.choices[0].message.content;

  try {
    // Try to parse, handling potential markdown code blocks
    const cleaned = content.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    const parsed = JSON.parse(cleaned);
    return {
      title: parsed.title || 'Untitled Lesson',
      summary: parsed.summary || '',
      keyTakeaways: Array.isArray(parsed.keyTakeaways) ? parsed.keyTakeaways : [],
      actionItems: Array.isArray(parsed.actionItems) ? parsed.actionItems : [],
    };
  } catch (err) {
    return {
      title: `Lesson - ${clientName} - ${dateStr}`,
      summary: content,
      keyTakeaways: [],
      actionItems: [],
    };
  }
}

module.exports = { generateLessonFromTranscription };
