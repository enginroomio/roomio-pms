'use client';

import { useCallback, useEffect, useState } from 'react';
import { Bell, Loader2 } from 'lucide-react';
import { useSession } from '@/components/auth/SessionProvider';
import { browserHasPushSubscription, showHkBrowserNotification } from '@/lib/client/show-hk-notification';
import { emitHkPushAlert } from '@/lib/client/hk-push-alert';
import { notifyHkOnlineRefresh } from '@/lib/client/hk-online-refresh';

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

  try {
    await registration.update();
  } catch {
    // Güncel SW yoksa mevcut sürüm kullanılır
  }

  await Promise.race([
    navigator.serviceWorker.ready,
    new Promise<never>((_, reject) => {
      window.setTimeout(() => reject(new Error('Service worker zaman aşımı')), timeoutMs);
    }),
  ]);

  return registration;
}

async function getBrowserSubscription(): Promise<PushSubscription | null> {
  if (!('serviceWorker' in navigator)) return null;
  const reg = await navigator.serviceWorker.getRegistration('/');
  if (!reg || !('pushManager' in reg)) return null;
  return reg.pushManager.getSubscription();
}

async function syncSubscriptionToServer(sub: PushSubscription, deviceLabel: string) {
  const saveRes = await fetch('/api/push/subscribe', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      subscription: sub.toJSON(),
      role: 'hk',
      deviceLabel,
    }),
  });
  const saveBody = (await saveRes.json()) as { ok: boolean; message?: string };
  if (!saveRes.ok || !saveBody.ok) {
    throw new Error(saveBody.message ?? 'Sunucu kaydı başarısız');
  }
  notifyHkOnlineRefresh();
}

async function sendPresenceHeartbeat(): Promise<void> {
  const sub = await getBrowserSubscription();
  if (!sub) return;
  await fetch('/api/push/presence', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ endpoint: sub.endpoint }),
  }).catch(() => undefined);
  notifyHkOnlineRefresh();
}

export function HkPushRegister() {
  const { user } = useSession();
  const deviceLabel = `${user.name} · HK Mobil`;
  const [ready, setReady] = useState(false);
  const [busy, setBusy] = useState(true);
  const [testing, setTesting] = useState(false);
  const [hint, setHint] = useState<string | null>(null);

  const ensurePushRegistration = useCallback(async (): Promise<boolean> => {
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

    await syncSubscriptionToServer(sub, deviceLabel);
    await sendPresenceHeartbeat();
    return true;
  }, [deviceLabel]);

  const refresh = useCallback(async (quiet = false) => {
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

    if (!quiet) setBusy(true);
    try {
      const ok = await ensurePushRegistration();
      setReady(ok || (await browserHasPushSubscription()));
      setHint(null);
    } catch {
      const linked = await browserHasPushSubscription();
      setReady(linked);
      if (linked) await sendPresenceHeartbeat();
      if (!linked) {
        setHint('Sayfayı yenileyin (Cmd+Shift+R) veya Test bildirimi');
      }
    } finally {
      if (!quiet) setBusy(false);
    }
  }, [ensurePushRegistration]);

  useEffect(() => {
    void refresh();

    const onFocus = () => void refresh(true);
    const onVisible = () => {
      if (document.visibilityState === 'visible') void refresh(true);
    };

    window.addEventListener('focus', onFocus);
    document.addEventListener('visibilitychange', onVisible);

    const heartbeat = window.setInterval(() => {
      if (document.visibilityState === 'visible') void sendPresenceHeartbeat();
    }, 45_000);

    let swCleanup: (() => void) | undefined;
    if ('serviceWorker' in navigator) {
      const onControllerChange = () => void refresh(true);
      navigator.serviceWorker.addEventListener('controllerchange', onControllerChange);
      swCleanup = () => navigator.serviceWorker.removeEventListener('controllerchange', onControllerChange);
    }

    return () => {
      window.removeEventListener('focus', onFocus);
      document.removeEventListener('visibilitychange', onVisible);
      window.clearInterval(heartbeat);
      swCleanup?.();
    };
  }, [refresh]);

  async function sendTestNotification() {
    setTesting(true);
    const title = 'Roomio HK Test';
    const body = 'Oda 108 kirli — bildirim testi';
    emitHkPushAlert({ title, body });

    try {
      await refresh(true);
      await showHkBrowserNotification(body, title);
      const res = await fetch('/api/push/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, body }),
      });
      const sendBody = (await res.json()) as { ok?: boolean; sent?: number; message?: string };
      if (sendBody.ok && (sendBody.sent ?? 0) > 0) {
        setHint(null);
        setReady(true);
      } else if (sendBody.message) {
        setHint(sendBody.message);
      }
    } catch {
      setHint('Test gönderilemedi — Cmd+Shift+R ile yenileyin');
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
