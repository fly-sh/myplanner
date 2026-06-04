const express = require('express');
const router = express.Router();
const { listEvents, createEvent, updateEvent, deleteEvent } = require('../services/googleCalendar');

function requireAuth(req, res, next) {
  if (!req.session.tokens) return res.status(401).json({ error: '로그인이 필요합니다' });
  next();
}

// 일정 목록 조회
router.get('/', requireAuth, async (req, res) => {
  try {
    const { timeMin, timeMax } = req.query;
    const now = new Date();
    const min = timeMin || new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
    const max = timeMax || new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59).toISOString();

    const events = await listEvents(req.session.tokens, min, max);
    res.json(events);
  } catch (err) {
    console.error('[캘린더 조회 오류]', err.message);
    res.status(500).json({ error: '일정 조회 실패' });
  }
});

// 일정 생성
router.post('/', requireAuth, async (req, res) => {
  try {
    const { title, description, startDateTime, endDateTime, isAllDay } = req.body;

    const eventData = {
      summary: title,
      description,
      start: isAllDay ? { date: startDateTime } : { dateTime: startDateTime, timeZone: 'Asia/Seoul' },
      end: isAllDay ? { date: endDateTime } : { dateTime: endDateTime, timeZone: 'Asia/Seoul' },
    };

    const event = await createEvent(req.session.tokens, eventData);
    res.json(event);
  } catch (err) {
    console.error('[일정 생성 오류]', err.message);
    res.status(500).json({ error: '일정 생성 실패' });
  }
});

// 일정 수정
router.put('/:eventId', requireAuth, async (req, res) => {
  try {
    const { title, description, startDateTime, endDateTime, isAllDay } = req.body;

    const eventData = {
      summary: title,
      description,
      start: isAllDay ? { date: startDateTime } : { dateTime: startDateTime, timeZone: 'Asia/Seoul' },
      end: isAllDay ? { date: endDateTime } : { dateTime: endDateTime, timeZone: 'Asia/Seoul' },
    };

    const event = await updateEvent(req.session.tokens, req.params.eventId, eventData);
    res.json(event);
  } catch (err) {
    console.error('[일정 수정 오류]', err.message);
    res.status(500).json({ error: '일정 수정 실패' });
  }
});

// 일정 삭제
router.delete('/:eventId', requireAuth, async (req, res) => {
  try {
    await deleteEvent(req.session.tokens, req.params.eventId);
    res.json({ success: true });
  } catch (err) {
    console.error('[일정 삭제 오류]', err.message);
    res.status(500).json({ error: '일정 삭제 실패' });
  }
});

module.exports = router;
