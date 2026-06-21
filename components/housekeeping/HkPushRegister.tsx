'use client';

import { useCallback, useEffect, useState } from 'react';
import { Bell, Loader2 } from 'lucide-react';
import { browserHasPushSubscription, showHkBrowserNotification } from '@/lib/client/show-hk-notification';
import { emitHkPushAlert } from '@/lib/client/hk-push-alert';

function urlBase64ToUint8Array(base64String: string) {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const raw = window.atob(base64);
  return Uint8Array.from([...raw].map((char) => char.charCodeAt(0)));
}

function isIosDevice() {
  return /iphone|ipad|ipod/i.test(navigator.userAgent);
}

function isStandalonePwa() {
  return (
    window.matchMedia('(display-mode: standalone)').matches ||
    ('standalone' in navigator && Boolean((navigator as Navigator & { standalone?: boolean }).standalone))
  );
}

async function ensureServiceWorker(timeoutMs = 12_000) {
  if (!('serviceWorker' in navigator)) {
    throw new Error('Service worker desteklenmiyor');
  }

  const existing = await navigator.serviceWorker.getRegistration('/');
  const registration = existing ?? (await navigator.serviceWorker.register('/sw.js', { scope: '/' }));

  await Promise.race([
    navigator.serviceWorker.ready,
    new Promise<never>((_, reject) => {
      window.setTimeout(() => reject(new Error('Service worker zaman aşımı')), timeoutMs);
    }),
  ]);

  return registration;
}

async function syncSubscriptionToServer(sub: PushSubscription) {
  const saveRes = await fetch('/api/push/subscribe', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      subscription: sub.toJSON(),
      role: 'hk',
      deviceLabel: 'HK Mobil',
    }),
  });
  const saveBody = (await saveRes.json()) as { ok: boolean; message?: string };
  if (!saveRes.ok || !saveBody.ok) {
    throw new Error(saveBody.message ?? 'Sunucu kaydı başarısız');
  }
}

async function ensurePushRegistration(): Promise<boolean> {
  if (!('Notification' in window) || !('serviceWorker' in navigator)) return false;
  if (isIosDevice() && !isStandalonePwa()) return false;

  let permission = Notification.permission;
  if (permission === 'default') {
    permission = await Notification.requestPermission();
  }
  if (permission !== 'granted') return false;

  const keyRes = await fetch('/api/push/vapid-public-key', { cache: 'no-store' });
  const keyBody = (await keyRes.json()) as { ok: boolean; publicKey: string | null };
  if (!keyRes.ok || !keyBody.ok || !keyBody.publicKey) return false;

  const reg = await ensureServiceWorker();
  if (!('pushManager' in reg)) return false;

  let sub = await reg.pushManager.getSubscription();
  if (!sub) {
    sub = await reg.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(keyBody.publicKey),
    });
  }

  await syncSubscriptionToServer(sub);
  return true;
}

export function HkPushRegister() {
  const [ready, setReady] = useState(false);
  const [busy, setBusy] = useState(true);
  const [testing, setTesting] = useState(false);
  const [hint, setHint] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    if (!('Notification' in window)) {
      setBusy(false);
      setHint(null);
      return;
    }

    if (Notification.permission === 'denied') {
      setBusy(false);
      setReady(false);
      setHint('Bildirimler kapalı — Chrome kilit simgesinden İzin ver');
      return;
    }

    if (isIosDevice() && !isStandalonePwa()) {
      setBusy(false);
      setHint('iPhone: Ana Ekrana Ekle ile açın');
      return;
    }

    setBusy(true);
    try {
      const ok = await ensurePushRegistration();
      setReady(ok || (await browserHasPushSubscription()));
      setHint(null);
    } catch {
      setReady(await browserHasPushSubscription());
    } finally {
      setBusy(false);
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  async function sendTestNotification() {
    setTesting(true);
    const title = 'Roomio HK Test';
    const body = 'Oda 108 kirli — bildirim testi';
    emitHkPushAlert({ title, body });

    try {
      if (!ready) await refresh();
      await showHkBrowserNotification(body, title);
      const res = await fetch('/api/push/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, body }),
      });
      const sendBody = (await res.json()) as { ok?: boolean; sent?: number; message?: string };
      if (sendBody.ok && (sendBody.sent ?? 0) > 0) {
        setHint(null);
      } else if (sendBody.message) {
        setHint(sendBody.message);
      }
    } catch {
      setHint('Test gönderilemedi');
    } finally {
      setTesting(false);
    }
  }

  if (!('Notification' in window) || !('serviceWorker' in navigator)) {
    return null;
  }

  return (
    <div className="roomio-hk-push">
      <div className="roomio-hk-push__actions">
        <span className="roomio-hk-push__status" title={ready ? 'Bildirimler açık' : 'Hazırlanıyor…'}>
          {busy ? <Loader2 size={16} className="roomio-hk-push__spin" /> : <Bell size={16} />}
        </span>
        <button
          type="button"
          className="roomio-btn roomio-btn--ghost roomio-btn--sm"
          onClick={() => void sendTestNotification()}
          disabled={testing || busy}
        >
          {testing ? 'Gönderiliyor…' : 'Test bildirimi'}
        </button>
      </div>
      {hint ? <p className="roomio-hk-push-hint">{hint}</p> : null}
    </div>
  );
}
