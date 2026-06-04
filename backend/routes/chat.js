const express = require('express');
const router = express.Router();
const { listEvents, createEvent } = require('../services/googleCalendar');
const { pool } = require('../db/database');

// ─── 날짜 파싱 ─────────────────────────────────────────────
const DAY_MAP = { '일': 0, '월': 1, '화': 2, '수': 3, '목': 4, '금': 5, '토': 6 };

function parseDate(text) {
  const now = new Date();

  // "다음주 화요일" → 다음주 해당 요일
  const nextWeekMatch = text.match(/다음\s*주?\s*(일|월|화|수|목|금|토)요일/);
  if (nextWeekMatch) {
    const target = DAY_MAP[nextWeekMatch[1]];
    const current = now.getDay();
    // 다음 주 월요일까지 일수 계산 (한국 기준 월요일이 주 시작)
    const daysToNextMonday = (8 - current) % 7 || 7;
    const nextMonday = new Date(now);
    nextMonday.setDate(now.getDate() + daysToNextMonday);
    // 다음 주 월요일로부터 목표 요일까지
    const daysFromMonday = (target - 1 + 7) % 7;
    nextMonday.setDate(nextMonday.getDate() + daysFromMonday);
    return nextMonday;
  }

  // "이번주 화요일" 또는 그냥 "화요일" → 이번주 해당 요일 (이미 지났으면 다음주)
  const thisWeekMatch = text.match(/(?:이번\s*주?)?\s*(일|월|화|수|목|금|토)요일/);
  if (thisWeekMatch) {
    const target = DAY_MAP[thisWeekMatch[1]];
    const current = now.getDay();
    let diff = target - current;
    if (diff <= 0) diff += 7;
    const d = new Date(now);
    d.setDate(now.getDate() + diff);
    return d;
  }

  if (/오늘/.test(text)) return new Date(now);
  if (/내일/.test(text)) { const d = new Date(now); d.setDate(d.getDate() + 1); return d; }
  if (/모레/.test(text)) { const d = new Date(now); d.setDate(d.getDate() + 2); return d; }

  const m = text.match(/(\d{1,2})월\s*(\d{1,2})일/);
  if (m) return new Date(now.getFullYear(), parseInt(m[1]) - 1, parseInt(m[2]));

  return new Date(now);
}

// ─── 시간 파싱 ─────────────────────────────────────────────
function parseTime(text) {
  // 오후/저녁 → PM
  const pm = text.match(/(오후|저녁)\s*(\d{1,2})시(?:\s*(\d{1,2})분)?/);
  if (pm) { let h = parseInt(pm[2]); if (h < 12) h += 12; return { h, m: parseInt(pm[3] || 0) }; }

  // 오전/아침 → AM
  const am = text.match(/(오전|아침)\s*(\d{1,2})시(?:\s*(\d{1,2})분)?/);
  if (am) return { h: parseInt(am[2]), m: parseInt(am[3] || 0) };

  // 숫자만 → 1~8시는 오후로 간주
  const t = text.match(/(\d{1,2})시(?:\s*(\d{1,2})분)?/);
  if (t) { let h = parseInt(t[1]); if (h >= 1 && h <= 8) h += 12; return { h, m: parseInt(t[2] || 0) }; }

  return { h: 9, m: 0 };
}

// ─── 제목 추출 ─────────────────────────────────────────────
function extractTitle(text) {
  return text
    // 시간 표현 제거 (저녁/아침 등 시간 수식어 포함해서 함께 제거)
    .replace(/(오전|오후|저녁|아침|낮)\s*\d{1,2}시(\s*\d{1,2}분)?/g, '')
    .replace(/\d{1,2}시(\s*\d{1,2}분)?/g, '')
    // 요일/날짜 제거
    .replace(/다음\s*주?\s*(일|월|화|수|목|금|토)요일/g, '')
    .replace(/(이번\s*주?)?\s*(일|월|화|수|목|금|토)요일/g, '')
    .replace(/오늘|내일|모레/g, '')
    .replace(/\d{1,2}월\s*\d{1,2}일/g, '')
    // 캘린더 관련 표현 제거
    .replace(/내\s*개인\s*캘린더에?/g, '')
    .replace(/내\s*캘린더에?/g, '')
    .replace(/개인\s*캘린더에?/g, '')
    .replace(/캘린더에?/g, '')
    // 행동 키워드 제거
    .replace(/(일정|약속|스케줄)\s*(등록|추가|만들어|잡아|넣어)\s*(줘|주세요|해줘|달라|해달라|줄래)?/g, '')
    .replace(/(등록|추가)\s*(해줘|해달라|해주세요|줘|달라|했는데|줄래)/g, '')
    .replace(/일정\s*(등록|추가|내|캘린더)/g, '')
    .replace(/(등록|추가)해줘/g, '')
    // 끝에 홀로 남은 "일정" 제거
    .replace(/\s*일정\s*$/g, '')
    // 앞뒤 조사 제거
    .replace(/^[에을를이가은는으로]\s*/g, '')
    .replace(/\s+[에을를이가은는으로](\s|$)/g, ' ')
    .replace(/\s+[에을를이가은는으로]$/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

function formatTime(h, m) {
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
}

function formatDate(date) {
  const days = ['일', '월', '화', '수', '목', '금', '토'];
  return `${date.getMonth() + 1}월 ${date.getDate()}일 (${days[date.getDay()]})`;
}

// ─── 메시지 처리 ──────────────────────────────────────────
router.post('/', async (req, res) => {
  if (!req.session.tokens) return res.status(401).json({ error: '로그인이 필요합니다' });

  const { message } = req.body;
  const msg = (message || '').trim();
  if (!msg) return res.json({ reply: '메시지를 입력해주세요.' });

  try {
    // 인사
    if (/^(안녕|하이|ㅎㅇ|반가|헬로|hello|hi)/i.test(msg)) {
      return res.json({ reply: '안녕하세요! 😊\n\n이렇게 말씀해 주세요:\n\n📅 "다음주 화요일 저녁 7시 세익 저녁 식사 등록해줘"\n📋 "오늘 일정 알려줘"\n✅ "할일 추가: 보고서 작성"\n☑️ "할일 목록 보여줘"\n📆 "오늘 요약해줘"' });
    }

    // 도움말
    if (/도움|뭐할|사용법|어떻게/.test(msg) && !/일정|할일/.test(msg)) {
      return res.json({ reply: '이렇게 사용할 수 있어요! 😊\n\n📅 일정 등록\n"다음주 화요일 저녁 7시 세익 저녁 식사 등록해줘"\n"내일 오전 10시 병원 일정 추가해줘"\n\n📋 일정 확인\n"오늘 일정 알려줘"\n"이번 주 일정 보여줘"\n\n✅ 할일 추가\n"할일 추가: 보고서 작성"\n\n☑️ 할일 확인\n"할일 목록 보여줘"' });
    }

    // ── 일정 등록 ──
    const isCreateEvent =
      (/(일정|약속|미팅|회의|스케줄).*(등록|추가|만들|잡|넣)|등록|추가/.test(msg)) &&
      !/할일|해야/.test(msg);

    if (isCreateEvent) {
      const date = parseDate(msg);
      const time = parseTime(msg);
      date.setHours(time.h, time.m, 0, 0);
      const endDate = new Date(date.getTime() + 60 * 60 * 1000);
      const title = extractTitle(msg) || '새 일정';

      await createEvent(req.session.tokens, {
        summary: title,
        start: { dateTime: date.toISOString(), timeZone: 'Asia/Seoul' },
        end: { dateTime: endDate.toISOString(), timeZone: 'Asia/Seoul' },
      });

      return res.json({
        reply: `✅ 일정을 등록했어요!\n\n📅 ${title}\n🕐 ${formatDate(date)} ${formatTime(time.h, time.m)}`,
      });
    }

    // ── 일정 조회 ──
    const isListEvents =
      /(오늘|내일|모레|이번\s*주|(일|월|화|수|목|금|토)요일).*(일정|스케줄|뭐|있어)/.test(msg) ||
      /(일정|스케줄).*(확인|보여|알려|있어|뭐|목록)/.test(msg);

    if (isListEvents) {
      const start = new Date();
      const end = new Date();
      let label = '오늘';

      if (/내일/.test(msg)) {
        label = '내일';
        start.setDate(start.getDate() + 1);
        end.setDate(end.getDate() + 1);
      } else if (/모레/.test(msg)) {
        label = '모레';
        start.setDate(start.getDate() + 2);
        end.setDate(end.getDate() + 2);
      } else if (/이번\s*주/.test(msg)) {
        label = '이번 주';
        end.setDate(end.getDate() + 7);
      } else {
        // 특정 요일 조회
        const dayMatch = msg.match(/(?:다음\s*주?)?\s*(일|월|화|수|목|금|토)요일/);
        if (dayMatch) {
          const d = parseDate(msg);
          label = formatDate(d);
          start.setFullYear(d.getFullYear(), d.getMonth(), d.getDate());
          end.setFullYear(d.getFullYear(), d.getMonth(), d.getDate());
        }
      }

      start.setHours(0, 0, 0, 0);
      end.setHours(23, 59, 59, 999);

      const events = await listEvents(req.session.tokens, start.toISOString(), end.toISOString());

      if (!events || events.length === 0) {
        return res.json({ reply: `📅 ${label} 일정이 없어요!\n\n"내일 오후 3시 미팅 일정 등록해줘" 처럼 말씀해 주시면 바로 등록해 드릴게요 😊` });
      }

      const list = events.map(ev => {
        const st = ev.start.dateTime ? new Date(ev.start.dateTime) : null;
        const timeStr = st ? formatTime(st.getHours(), st.getMinutes()) : '종일';
        const dateStr = label === '이번 주' && st ? `${st.getMonth()+1}/${st.getDate()} ` : '';
        return `• ${dateStr}${timeStr} ${ev.summary}`;
      }).join('\n');

      return res.json({ reply: `📅 ${label} 일정 (${events.length}개)\n\n${list}` });
    }

    // ── 할일 추가 ──
    const isAddTodo =
      /(할일|할 일|해야).*(추가|등록|만들|넣)/.test(msg) ||
      /(추가|등록).*(할일|할 일)/.test(msg);

    if (isAddTodo) {
      let title = msg
        .replace(/(할일|할 일|해야\s*할\s*일)\s*(추가|등록|만들어|넣어)\s*(줘|주세요|줄래)?[:：]?\s*/gi, '')
        .replace(/(추가|등록)\s*(해줘|해주세요|줘|달라)?/g, '')
        .trim();

      if (!title) return res.json({ reply: '할일 내용을 함께 말씀해 주세요!\n예시: "할일 추가: 보고서 작성"' });

      await pool.query('INSERT INTO todos (title) VALUES ($1)', [title]);
      return res.json({ reply: `✅ 할일을 추가했어요!\n\n☐ ${title}\n\n"할일 목록 보여줘"로 전체 목록을 확인하세요.` });
    }

    // ── 할일 조회 ──
    const isListTodos =
      /(할일|할 일).*(목록|확인|보여|알려|있어|뭐)/.test(msg) ||
      /미완료/.test(msg);

    if (isListTodos) {
      const { rows: todos } = await pool.query('SELECT * FROM todos WHERE is_completed = 0 ORDER BY created_at DESC');
      const { rows: [{ cnt }] } = await pool.query('SELECT COUNT(*) as cnt FROM todos WHERE is_completed = 1');

      if (todos.length === 0) {
        return res.json({ reply: `🎉 미완료 할일이 없어요!\n완료된 할일: ${done.cnt}개` });
      }

      const list = todos.map(t => `☐ ${t.title}${t.due_date ? ` (~${t.due_date})` : ''}`).join('\n');
      return res.json({ reply: `📋 미완료 할일 (${todos.length}개)\n\n${list}\n\n완료된 할일: ${done.cnt}개` });
    }

    // ── 오늘 요약 ──
    if (/요약|브리핑|오늘\s*(어때|어떻게|뭐)/.test(msg)) {
      const now = new Date();
      const start = new Date(now); start.setHours(0, 0, 0, 0);
      const end = new Date(now); end.setHours(23, 59, 59, 999);

      const [events, todos] = await Promise.all([
        listEvents(req.session.tokens, start.toISOString(), end.toISOString()),
        pool.query('SELECT * FROM todos WHERE is_completed = 0').then(r => r.rows),
      ]);

      const days = ['일', '월', '화', '수', '목', '금', '토'];
      const today = `${now.getMonth()+1}월 ${now.getDate()}일 (${days[now.getDay()]})`;
      let reply = `📆 ${today} 요약\n\n`;
      reply += `📅 오늘 일정: ${events?.length || 0}개\n`;
      if (events?.length > 0) {
        reply += events.slice(0, 3).map(ev => {
          const st = ev.start.dateTime ? new Date(ev.start.dateTime) : null;
          return `  • ${st ? formatTime(st.getHours(), st.getMinutes()) : '종일'} ${ev.summary}`;
        }).join('\n') + '\n';
      }
      reply += `\n✅ 미완료 할일: ${todos.length}개`;
      if (todos.length > 0) {
        reply += '\n' + todos.slice(0, 3).map(t => `  ☐ ${t.title}`).join('\n');
        if (todos.length > 3) reply += `\n  ... 외 ${todos.length - 3}개`;
      }
      return res.json({ reply });
    }

    // 기본 응답
    return res.json({
      reply: '잘 이해하지 못했어요 🤔\n\n이렇게 말씀해 보세요:\n• "오늘 일정 알려줘"\n• "다음주 화요일 저녁 7시 세익 저녁 식사 등록해줘"\n• "할일 추가: 보고서 작성"\n• "할일 목록 보여줘"\n• "오늘 요약해줘"',
    });

  } catch (err) {
    console.error('[채팅 오류]', err.message);
    return res.json({ reply: '처리 중 오류가 발생했어요. 다시 시도해주세요.' });
  }
});

module.exports = router;
