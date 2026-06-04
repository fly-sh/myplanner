const express = require('express');
const router = express.Router();
const { pool } = require('../db/database');

router.get('/vapid-key', (req, res) => {
  res.json({ publicKey: process.env.VAPID_PUBLIC_KEY });
});

router.post('/subscribe', async (req, res) => {
  try {
    await pool.query(
      `INSERT INTO push_subscriptions (endpoint, p256dh, auth) VALUES ($1, $2, $3)
       ON CONFLICT (endpoint) DO UPDATE SET p256dh = $2, auth = $3`,
      [req.body.endpoint, req.body.keys.p256dh, req.body.keys.auth]
    );
    res.json({ success: true });
  } catch (err) {
    console.error('[푸시 구독 오류]', err.message);
    res.status(500).json({ error: '구독 저장 실패' });
  }
});

module.exports = router;
