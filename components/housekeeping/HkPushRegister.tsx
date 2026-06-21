'use client';

import { useEffect, useState } from 'react';
import { Bell, BellOff } from 'lucide-react';

function urlBase64ToUint8Array(base64String: string) {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const raw = window.atob(base64);
  return Uint8Array.from([...raw].map((char) => char.charCodeAt(0)));
}

export function HkPushRegister() {
  const [status, setStatus] = useState<'idle' | 'ready' | 'denied' | 'unsupported' | 'missing-keys'>('idle');

  useEffect(() => {
    if (!('Notification' in window) || !('serviceWorker' in navigator)) {
      setStatus('unsupported');
    }
  }, []);

  async function subscribe() {
    try {
      const keyRes = await fetch('/api/push/vapid-public-key');
      const keyBody = (await keyRes.json()) as { ok: boolean; publicKey: string | null };
      if (!keyBody.ok || !keyBody.publicKey) {
        setStatus('missing-keys');
        return;
      }

      const permission = await Notification.requestPermission();
      if (permission !== 'granted') {
        setStatus('denied');
        return;
      }

      const reg = await navigator.serviceWorker.ready;
      const sub = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(keyBody.publicKey),
      });

      await fetch('/api/push/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          subscription: sub.toJSON(),
          role: 'hk',
          deviceLabel: 'HK Mobil',
        }),
      });

      setStatus('ready');
    } catch {
      setStatus('denied');
    }
  }

  if (status === 'unsupported') return null;

  return (
    <button
      type="button"
      className="roomio-btn roomio-btn--ghost roomio-btn--sm"
      onClick={() => void subscribe()}
      title="HK görev bildirimleri"
    >
      {status === 'ready' ? <Bell size={16} /> : <BellOff size={16} />}
      {status === 'ready' ? 'Bildirim açık' : 'Bildirimleri aç'}
    </button>
  );
}
