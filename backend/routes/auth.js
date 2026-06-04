const express = require('express');
const router = express.Router();
const { getOAuthClient } = require('../services/googleCalendar');

const SCOPES = ['https://www.googleapis.com/auth/calendar'];

// 구글 로그인 시작
router.get('/google', (req, res) => {
  const auth = getOAuthClient();
  const url = auth.generateAuthUrl({
    access_type: 'offline',
    scope: SCOPES,
    prompt: 'consent',
  });
  res.redirect(url);
});

// 구글 로그인 콜백
router.get('/google/callback', async (req, res) => {
  const { code } = req.query;
  try {
    const auth = getOAuthClient();
    const { tokens } = await auth.getToken(code);
    req.session.tokens = tokens;
    res.redirect(process.env.FRONTEND_URL);
  } catch (err) {
    console.error('[Auth 오류]', err.message);
    res.redirect(`${process.env.FRONTEND_URL}?error=auth_failed`);
  }
});

// 로그인 상태 확인
router.get('/status', (req, res) => {
  res.json({ loggedIn: !!req.session.tokens });
});

// 로그아웃
router.post('/logout', (req, res) => {
  req.session.destroy();
  res.json({ success: true });
});

module.exports = router;
