require('dotenv').config();
const express = require('express');
const cors = require('cors');
const session = require('express-session');
const pgSession = require('connect-pg-simple')(session);
const path = require('path');
const { pool, initDB } = require('./db/database');

const isProd = process.env.NODE_ENV === 'production';
const PORT = process.env.PORT || 3001;

const app = express();

app.use(cors({
  origin: isProd ? true : (process.env.FRONTEND_URL || 'http://localhost:5173'),
  credentials: true,
}));
app.use(express.json());

async function startServer() {
  await initDB();

  // 세션 - PostgreSQL에 저장 (서버 재시작해도 로그인 유지)
  app.use(session({
    store: new pgSession({ pool, tableName: 'user_sessions', createTableIfMissing: true }),
    secret: process.env.SESSION_SECRET || 'dev-secret-change-this',
    resave: false,
    saveUninitialized: false,
    cookie: {
      secure: isProd,
      maxAge: 30 * 24 * 60 * 60 * 1000, // 30일
    },
  }));

  const authRoutes = require('./routes/auth');
  const calendarRoutes = require('./routes/calendar');
  const todoRoutes = require('./routes/todos');
  const noteRoutes = require('./routes/notes');
  const pushRoutes = require('./routes/push');
  const chatRoutes = require('./routes/chat');
  const { startScheduler } = require('./scheduler/notificationScheduler');

  app.use('/auth', authRoutes);
  app.use('/calendar', calendarRoutes);
  app.use('/todos', todoRoutes);
  app.use('/notes', noteRoutes);
  app.use('/push', pushRoutes);
  app.use('/chat', chatRoutes);
  app.get('/health', (req, res) => res.json({ status: 'ok' }));

  // 프로덕션에서 빌드된 프론트엔드 서빙
  if (isProd) {
    app.use(express.static(path.join(__dirname, 'public')));
    app.get('*', (req, res) => {
      res.sendFile(path.join(__dirname, 'public', 'index.html'));
    });
  }

  app.listen(PORT, () => {
    console.log(`[서버] http://localhost:${PORT} (${isProd ? 'production' : 'development'})`);
    startScheduler(() => null);
  });
}

startServer().catch(err => {
  console.error('[서버 시작 실패]', err.message);
  process.exit(1);
});
