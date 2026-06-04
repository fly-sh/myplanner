import { useEffect } from 'react';
import axios from 'axios';

// base64 → Uint8Array 변환 (VAPID 공개키용)
function urlBase64ToUint8Array(base64String) {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = window.atob(base64);
  return Uint8Array.from([...rawData].map(char => char.charCodeAt(0)));
}

export function usePushNotification() {
  useEffect(() => {
    if (!('serviceWorker' in navigator) || !('PushManager' in window)) return;

    async function subscribe() {
      try {
        const registration = await navigator.serviceWorker.ready;
        const existing = await registration.pushManager.getSubscription();
        if (existing) return; // 이미 구독 중

        const { data } = await axios.get('/push/vapid-key');
        const subscription = await registration.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: urlBase64ToUint8Array(data.publicKey),
        });

        await axios.post('/push/subscribe', subscription);
        console.log('[PWA] 푸시 알림 구독 완료');
      } catch (err) {
        console.warn('[PWA] 푸시 구독 실패:', err.message);
      }
    }

    // 알림 권한 요청 후 구독
    Notification.requestPermission().then(permission => {
      if (permission === 'granted') subscribe();
    });
  }, []);
}
