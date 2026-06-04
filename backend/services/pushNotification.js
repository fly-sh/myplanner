const webpush = require('web-push');
const { pool } = require('../db/database');

webpush.setVapidDetails(
  process.env.VAPID_EMAIL,
  process.env.VAPID_PUBLIC_KEY,
  process.env.VAPID_PRIVATE_KEY
);

async function sendPushToAll(payload) {
  const { rows: subscriptions } = await pool.query('SELECT * FROM push_subscriptions');
  const message = JSON.stringify(payload);

  await Promise.allSettled(
    subscriptions.map(sub =>
      webpush.sendNotification(
        { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
        message
      ).catch(async err => {
        if (err.statusCode === 410) {
          await pool.query('DELETE FROM push_subscriptions WHERE endpoint = $1', [sub.endpoint]);
        }
      })
    )
  );
}

module.exports = { sendPushToAll };
