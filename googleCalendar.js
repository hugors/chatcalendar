const { google } = require('googleapis');

const calendar = google.calendar('v3');

const auth = new google.auth.JWT(
  process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
  null,
  process.env.GOOGLE_PRIVATE_KEY.replace(/\\n/g, '\n'),
  ['https://www.googleapis.com/auth/calendar']
);

// Função para listar os próximos eventos
async function listEvents() {
  await auth.authorize();

  const res = await calendar.events.list({
    auth,
    calendarId: process.env.CALENDAR_ID,
    timeMin: new Date().toISOString(),
    maxResults: 5,
    singleEvents: true,
    orderBy: 'startTime',
  });

  return res.data.items || [];
}

module.exports = {
  listEvents
};
