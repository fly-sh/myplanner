const cron = require('node-cron');
const { getUpcomingEvents } = require('../services/googleCalendar');
const { sendPushToAll } = require('../services/pushNotification');

// 이미 알림 보낸 이벤트 추적 (서버 재시작 시 초기화됨, 간단한 MVP용)
const notifiedEvents = new Set();

function startScheduler(getTokens) {
  // 매 분마다 실행
  cron.schedule('* * * * *', async () => {
    const tokens = getTokens();
    if (!tokens) return;

    try {
      const events = await getUpcomingEvents(tokens);
      const now = new Date();

      for (const event of events) {
        const startTime = event.start?.dateTime || event.start?.date;
        if (!startTime) continue;

        const eventStart = new Date(startTime);
        const diffMinutes = Math.round((eventStart - now) / 60000);

        // 30분 전, 10분 전 알림
        const shouldNotify = [30, 10].includes(diffMinutes);
        const notifyKey = `${event.id}-${diffMinutes}`;

        if (shouldNotify && !notifiedEvents.has(notifyKey)) {
          notifiedEvents.add(notifyKey);
          await sendPushToAll({
            title: `⏰ ${diffMinutes}분 후 일정`,
            body: event.summary || '제목 없는 일정',
            icon: '/icon-192.png',
            data: { eventId: event.id },
          });
          console.log(`[알림 발송] ${event.summary} - ${diffMinutes}분 전`);
        }
      }
    } catch (err) {
      console.error('[스케줄러 오류]', err.message);
    }
  });

  console.log('[스케줄러] 알림 스케줄러 시작됨 (매 분 체크)');
}

module.exports = { startScheduler };
