const { google } = require('googleapis');

function getOAuthClient() {
  return new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    process.env.GOOGLE_REDIRECT_URI
  );
}

function getCalendarClient(tokens) {
  const auth = getOAuthClient();
  auth.setCredentials(tokens);
  return google.calendar({ version: 'v3', auth });
}

// 일정 목록 조회 (시작일~종료일 범위)
async function listEvents(tokens, timeMin, timeMax) {
  const calendar = getCalendarClient(tokens);
  const res = await calendar.events.list({
    calendarId: 'primary',
    timeMin,
    timeMax,
    singleEvents: true,
    orderBy: 'startTime',
  });
  return res.data.items;
}

// 일정 생성
async function createEvent(tokens, eventData) {
  const calendar = getCalendarClient(tokens);
  const res = await calendar.events.insert({
    calendarId: 'primary',
    resource: eventData,
  });
  return res.data;
}

// 일정 수정
async function updateEvent(tokens, eventId, eventData) {
  const calendar = getCalendarClient(tokens);
  const res = await calendar.events.update({
    calendarId: 'primary',
    eventId,
    resource: eventData,
  });
  return res.data;
}

// 일정 삭제
async function deleteEvent(tokens, eventId) {
  const calendar = getCalendarClient(tokens);
  await calendar.events.delete({
    calendarId: 'primary',
    eventId,
  });
}

// 오늘 ~ 7일 후 일정 조회 (푸시 알림 스케줄러용)
async function getUpcomingEvents(tokens) {
  const now = new Date();
  const weekLater = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
  return listEvents(tokens, now.toISOString(), weekLater.toISOString());
}

module.exports = { getOAuthClient, listEvents, createEvent, updateEvent, deleteEvent, getUpcomingEvents };
