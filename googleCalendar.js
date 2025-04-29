const { google } = require('googleapis');
require('dotenv').config();

const auth = new google.auth.JWT(
  process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
  null,
  process.env.GOOGLE_PRIVATE_KEY.replace(/\\n/g, '\n'),
  ['https://www.googleapis.com/auth/calendar']
);

const calendar = google.calendar({ version: 'v3', auth });

async function createEvent(userId, summary, startTime, endTime) {
  const event = {
    summary: `[${userId}] ${summary}`,
    start: { dateTime: startTime },
    end: { dateTime: endTime }
  };
  return calendar.events.insert({
    calendarId: process.env.CALENDAR_ID,
    resource: event
  });
}

async function listUserEvents(userId) {
  const res = await calendar.events.list({
    calendarId: process.env.CALENDAR_ID,
    timeMin: new Date().toISOString(),
    maxResults: 10,
    singleEvents: true,
    orderBy: 'startTime'
  });

  return res.data.items.filter(e => e.summary.includes(`[${userId}]`));
}

async function deleteEventBySummary(userId, keyword) {
  const events = await listUserEvents(userId);
  const target = events.find(e => e.summary.includes(keyword));
  if (target) {
    await calendar.events.delete({
      calendarId: process.env.CALENDAR_ID,
      eventId: target.id
    });
    return true;
  }
  return false;
}

async function updateEvent(userId, keyword, newStartTime, newEndTime) {
  const events = await listUserEvents(userId);
  const target = events.find(e => e.summary.includes(keyword));
  if (target) {
    const updatedEvent = {
      ...target,
      start: { dateTime: newStartTime },
      end: { dateTime: newEndTime }
    };
    await calendar.events.update({
      calendarId: process.env.CALENDAR_ID,
      eventId: target.id,
      resource: updatedEvent
    });
    return true;
  }
  return false;
}

module.exports = { createEvent, listUserEvents, deleteEventBySummary, updateEvent };
