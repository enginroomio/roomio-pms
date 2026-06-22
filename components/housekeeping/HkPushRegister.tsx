'use client';

import { useCallback, useEffect, useState } from 'react';
import { Bell, BellOff, Loader2 } from 'lucide-react';
import { useSession } from '@/components/auth/SessionProvider';
import { browserHasPushSubscription, showHkBrowserNotification } from '@/lib/client/show-hk-notification';
import { emitHkPushAlert } from '@/lib/client/hk-push-alert';
import { notifyHkOnlineRefresh } from '@/lib/client/hk-online-refresh';
import { subscriptionMatchesVapid, urlBase64ToUint8Array } from '@/lib/client/vapid-key';

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

function permissionHint(permission: NotificationPermission): string | null {
  if (permission === 'denied') {
    return 'Site izni kapalı — adres çubuğu kilit → Bildirimler → İzin ver';
  }
  if (permission === 'default') {
    return 'Bildirim izni bekleniyor — Test bildirimi ile İzin ver deyin';
  }
  return null;
}

export function HkPushRegister() {
  const { user } = useSession();
  const deviceLabel = `${user.name} · HK Mobil`;
  const [ready, setReady] = useState(false);
  const [busy, setBusy] = useState(true);
  const [testing, setTesting] = useState(false);
  const [serverCount, setServerCount] = useState<number | null>(null);
  const [hint, setHint] = useState<string | null>(null);

  const ensurePushRegistration = useCallback(
    async (requestPermission = false): Promise<boolean> => {
      if (!('Notification' in window) || !('serviceWorker' in navigator)) return false;
      if (isIosDevice() && !isStandalonePwa()) return false;

      let permission = Notification.permission;
      if (requestPermission && permission === 'default') {
        permission = await Notification.requestPermission();
      }
      if (permission !== 'granted') return false;

      const keyRes = await fetch('/api/push/vapid-public-key', { cache: 'no-store' });
      const keyBody = (await keyRes.json()) as { ok: boolean; publicKey: string | null };
      if (!keyRes.ok || !keyBody.ok || !keyBody.publicKey) {
        throw new Error('VAPID anahtarı sunucuda tanımlı değil');
      }

      const reg = await ensureServiceWorker();
      if (!('pushManager' in reg)) return false;

      let sub = await reg.pushManager.getSubscription();
      if (sub && !subscriptionMatchesVapid(sub, keyBody.publicKey)) {
        try {
          await sub.unsubscribe();
        } catch {
          // Eski abonelik silinemese de yenisini deneriz
        }
        sub = null;
      }

      if (!sub) {
        sub = await reg.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: urlBase64ToUint8Array(keyBody.publicKey) as BufferSource,
        });
      }

      await syncSubscriptionToServer(sub, deviceLabel);
      await sendPresenceHeartbeat();
      return true;
    },
    [deviceLabel],
  );

  const refreshServerCount = useCallback(async () => {
    try {
      const res = await fetch('/api/push/subscribe?role=hk', { cache: 'no-store' });
      const body = (await res.json()) as { ok?: boolean; count?: number };
      if (body.ok && typeof body.count === 'number') setServerCount(body.count);
    } catch {
      // ignore
    }
  }, []);

  const refresh = useCallback(
    async (quiet = false, requestPermission = false) => {
      if (!('Notification' in window)) {
        setBusy(false);
        setHint(null);
        return;
      }

      const permHint = permissionHint(Notification.permission);
      if (Notification.permission === 'denied') {
        setBusy(false);
        setReady(false);
        setHint(permHint);
        void refreshServerCount();
        return;
      }

      if (isIosDevice() && !isStandalonePwa()) {
        setBusy(false);
        setHint('iPhone: Ana Ekrana Ekle ile açın');
        return;
      }

      if (!quiet) setBusy(true);
      try {
        const ok = await ensurePushRegistration(requestPermission);
        setReady(ok || (await browserHasPushSubscription()));
        setHint(ok ? null : permHint);
        await refreshServerCount();
      } catch (err) {
        const linked = await browserHasPushSubscription();
        setReady(linked);
        if (linked) await sendPresenceHeartbeat();
        const message = err instanceof Error ? err.message : 'Kayıt başarısız';
        setHint(linked ? `Sunucu senkronu: ${message}` : message);
        await refreshServerCount();
      } finally {
        if (!quiet) setBusy(false);
      }
    },
    [ensurePushRegistration, refreshServerCount],
  );

  useEffect(() => {
    void refresh(false, false);

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

  async function forceResubscribe() {
    setBusy(true);
    setHint(null);
    try {
      const sub = await getBrowserSubscription();
      if (sub) {
        try {
          await sub.unsubscribe();
        } catch {
          // ignore
        }
      }
      const ok = await ensurePushRegistration(true);
      setReady(ok);
      setHint(ok ? 'Yeniden kayıt tamam' : permissionHint(Notification.permission));
      await refreshServerCount();
    } catch (err) {
      setHint(err instanceof Error ? err.message : 'Yeniden kayıt başarısız');
    } finally {
      setBusy(false);
    }
  }

  async function sendTestNotification() {
    setTesting(true);
    const title = 'Roomio HK Test';
    const body = 'Oda 108 kirli — bildirim testi';
    emitHkPushAlert({ title, body });

    try {
      if (Notification.permission === 'default') {
        const permission = await Notification.requestPermission();
        if (permission !== 'granted') {
          setHint('Bildirim izni gerekli — Chrome popup\'ta İzin ver deyin');
          return;
        }
      }

      if (Notification.permission === 'denied') {
        setHint('Bildirimler kapalı — kilit simgesi → Bildirimler → İzin ver');
        return;
      }

      await refresh(true, true);

      const local = await showHkBrowserNotification(body, title);
      const res = await fetch('/api/push/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, body }),
      });
      const sendBody = (await res.json()) as {
        ok?: boolean;
        sent?: number;
        failed?: number;
        message?: string;
      };

      const parts: string[] = [];
      if (local.ok) {
        parts.push(`Chrome: ${local.method === 'service-worker' ? 'SW' : 'sayfa'} ✓`);
      } else {
        parts.push(
          'Chrome bildirimi gelmedi — macOS Sistem Ayarları → Bildirimler → Google Chrome açık olmalı',
        );
        if (local.error) parts.push(local.error);
      }

      if (sendBody.ok && (sendBody.sent ?? 0) > 0) {
        parts.push(`Sunucu push: ${sendBody.sent} cihaz`);
        setReady(true);
      } else if (sendBody.message) {
        parts.push(`Push: ${sendBody.message}`);
      }

      setHint(parts.join(' · '));
      await refreshServerCount();
    } catch {
      setHint('Test gönderilemedi — Cmd+Shift+R ile yenileyin, ardından Yeniden kaydol');
    } finally {
      setTesting(false);
    }
  }

  if (typeof window === 'undefined' || !('Notification' in window) || !('serviceWorker' in navigator)) {
    return null;
  }

  const permission = Notification.permission;

  return (
    <div className="roomio-hk-push">
      <div className="roomio-hk-push__actions">
        <span
          className="roomio-hk-push__status"
          title={ready ? 'Bildirimler açık' : permission === 'denied' ? 'İzin kapalı' : 'Hazırlanıyor…'}
        >
          {busy ? (
            <Loader2 size={16} className="roomio-hk-push__spin" />
          ) : permission === 'denied' || !ready ? (
            <BellOff size={16} />
          ) : (
            <Bell size={16} />
          )}
        </span>
        <button
          type="button"
          className="roomio-btn roomio-btn--ghost roomio-btn--sm"
          onClick={() => void sendTestNotification()}
          disabled={testing || busy}
        >
          {testing ? 'Gönderiliyor…' : 'Test bildirimi'}
        </button>
        <button
          type="button"
          className="roomio-btn roomio-btn--ghost roomio-btn--sm"
          onClick={() => void forceResubscribe()}
          disabled={testing || busy}
        >
          Yeniden kaydol
        </button>
      </div>
      {serverCount !== null ? (
        <p className="roomio-hk-push-meta">
          Sunucu: {serverCount} kayıtlı · İzin: {permission === 'granted' ? 'açık' : permission}
        </p>
      ) : null}
      {hint ? <p className="roomio-hk-push-hint">{hint}</p> : null}
    </div>
  );
}
