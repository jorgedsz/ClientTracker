const { PrismaClient } = require('@prisma/client');
const gmailService = require('./gmailService');
const emailProcessor = require('./emailProcessor');

const prisma = new PrismaClient();
let pollInterval = null;

async function startPolling(intervalMs = 60000) {
  if (pollInterval) clearInterval(pollInterval);

  const connected = await gmailService.getSetting('gmail_connected');
  if (connected !== 'true') {
    console.log('Gmail not connected, skipping poll start');
    return;
  }

  // Initialize history ID if needed
  let historyId = await gmailService.getSetting('gmail_last_history_id');
  if (!historyId) {
    historyId = await gmailService.getHistoryId();
    await gmailService.setSetting('gmail_last_history_id', historyId);
  }

  pollInterval = setInterval(() => poll(), intervalMs);
  console.log(`Gmail polling started (every ${intervalMs}ms)`);
}

async function stopPolling() {
  if (pollInterval) {
    clearInterval(pollInterval);
    pollInterval = null;
  }
}

async function poll() {
  try {
    const historyId = await gmailService.getSetting('gmail_last_history_id');
    if (!historyId) return { processed: 0 };

    const result = await gmailService.getMessagesSinceHistory(historyId);

    if (result.needsFullSync) {
      const newHistoryId = await gmailService.getHistoryId();
      await gmailService.setSetting('gmail_last_history_id', newHistoryId);
      return { processed: 0, note: 'History expired, reset to current' };
    }

    if (result.newHistoryId) {
      await gmailService.setSetting('gmail_last_history_id', result.newHistoryId);
    }

    let processed = 0;
    for (const messageId of result.messageIds) {
      try {
        const emailData = await gmailService.getEmailBody(messageId);
        await emailProcessor.processEmail(emailData, prisma);
        processed++;
      } catch (err) {
        console.error(`Error processing email ${messageId}:`, err.message);
      }
    }

    return { processed, total: result.messageIds.length };
  } catch (err) {
    console.error('Gmail poll error:', err.message);
    return { error: err.message };
  }
}

async function pollNow() {
  return await poll();
}

module.exports = { startPolling, stopPolling, pollNow };
