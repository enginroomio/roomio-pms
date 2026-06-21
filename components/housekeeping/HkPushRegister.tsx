'use client';

import { useCallback, useEffect, useState } from 'react';
import { Bell, BellOff, Loader2 } from 'lucide-react';
import { showHkBrowserNotification } from '@/lib/client/show-hk-notification';
import { emitHkPushAlert } from '@/lib/client/hk-push-alert';

type PushStatus =
  | 'idle'
  | 'subscribing'
  | 'ready'
  | 'denied'
  | 'unsupported'
  | 'missing-keys'
  | 'needs-install';

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
    throw new Error('Tarayıcı service worker desteklemiyor');
  }

  const existing = await navigator.serviceWorker.getRegistration('/');
  const registration = existing ?? (await navigator.serviceWorker.register('/sw.js', { scope: '/' }));

  await Promise.race([
    navigator.serviceWorker.ready,
    new Promise<never>((_, reject) => {
      window.setTimeout(() => reject(new Error('Service worker zaman aşımı — sayfayı yenileyip tekrar deneyin')), timeoutMs);
    }),
  ]);

  return registration;
}

async function fetchServerSubscriberCount(): Promise<number> {
  try {
    const res = await fetch('/api/push/subscribe', { cache: 'no-store' });
    const body = (await res.json()) as { count?: number };
    return body.count ?? 0;
  } catch {
    return -1;
  }
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
  const saveBody = (await saveRes.json()) as { ok: boolean; message?: string; count?: number };
  if (!saveRes.ok || !saveBody.ok) {
    throw new Error(saveBody.message ?? `Sunucu kaydı başarısız (HTTP ${saveRes.status})`);
  }
  return saveBody.count ?? -1;
}

export function HkPushRegister() {
  const [status, setStatus] = useState<PushStatus>('idle');
  const [hint, setHint] = useState<string | null>(null);
  const [testing, setTesting] = useState(false);
  const [serverCount, setServerCount] = useState<number | null>(null);

  const refreshServerCount = useCallback(async () => {
    const count = await fetchServerSubscriberCount();
    setServerCount(count >= 0 ? count : null);
    return count;
  }, []);

  async function pushTestFromServer() {
    const res = await fetch('/api/push/send', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title: 'Roomio HK Test',
        body: 'Bildirimler çalışıyor — Oda 108 kirli',
      }),
    });
    return {
      status: res.status,
      body: (await res.json()) as {
        ok?: boolean;
        sent?: number;
        failed?: number;
        subscribers?: number;
        message?: string;
      },
    };
  }

  async function showLocalNotification(body: string, title = 'Roomio HK') {
    return showHkBrowserNotification(body, title);
  }

  async function syncBrowserSubscriptionToServer(): Promise<boolean> {
    const reg = await ensureServiceWorker();
    if (!('pushManager' in reg)) return false;
    const existing = await reg.pushManager.getSubscription();
    if (!existing) return false;

    const count = await syncSubscriptionToServer(existing);
    await refreshServerCount();
    setStatus('ready');
    setHint(
      count >= 0
        ? `Sunucuya kaydedildi (${count} cihaz) — Test bildirimi ile deneyin`
        : 'Sunucuya kaydedildi — Test bildirimi ile deneyin',
    );
    return true;
  }

  useEffect(() => {
    if (!('Notification' in window) || !('serviceWorker' in navigator)) {
      setStatus('unsupported');
      setHint('Bu tarayıcı web bildirimlerini desteklemiyor');
      return;
    }

    if (isIosDevice() && !isStandalonePwa()) {
      setStatus('needs-install');
      setHint('iPhone/iPad: Safari paylaş menüsünden "Ana Ekrana Ekle" yapın, sonra uygulamadan açın');
      return;
    }

    if (Notification.permission === 'denied') {
      setStatus('denied');
      setHint('Bildirimler engelli — tarayıcı ayarlarından bu site için izin verin');
    }

    void (async () => {
      const count = await refreshServerCount();
      try {
        const synced = await syncBrowserSubscriptionToServer();
        if (synced) return;
        if (count > 0) {
          setHint('Tarayıcı kaydı yok — Bildirimleri aç veya Yeniden kaydol');
        } else if (Notification.permission === 'granted') {
          setHint('Sunucuda kayıt yok — Bildirimleri aç ile kaydolun');
        }
      } catch (err) {
        if (Notification.permission === 'granted') {
          setHint(
            err instanceof Error
              ? `Sunucu senkron hatası: ${err.message} — Yeniden kaydol deneyin`
              : 'Sunucu senkron hatası — Yeniden kaydol deneyin',
          );
        }
      }
    })();
  }, [refreshServerCount]);

  async function sendTestNotification() {
    setTesting(true);
    const title = 'Roomio HK Test';
    const body = 'Bildirimler çalışıyor — Oda 108 kirli';
    emitHkPushAlert({ title, body });
    setHint('Yeşil kutu sayfada görünmeli — macOS bildirimi sağ üstte');

    try {
      const localOk = await showLocalNotification(body, title);
      const { status: httpStatus, body: sendBody } = await pushTestFromServer();
      await refreshServerCount();

      if (httpStatus === 200 && sendBody.ok && (sendBody.sent ?? 0) > 0) {
        setHint(
          localOk
            ? 'Tamam — sayfadaki yeşil kutu + macOS sağ üst bildirimi'
            : 'Sunucu gönderdi — macOS sağ üst köşe / Bildirim Merkezi',
        );
        return;
      }
      if (sendBody.message?.includes('Kayıtlı cihaz yok')) {
        setStatus('idle');
        setHint('Sunucuda kayıt yok — Bildirimleri aç veya Yeniden kaydol');
        return;
      }
      if (localOk) {
        setHint('Yerel bildirim çalıştı (sağ üst); sunucu push için Yeniden kaydol');
        return;
      }
      setHint(sendBody.message ?? 'Sunucu push başarısız — yeşil kutu yine de görünmeli');
    } catch {
      setHint('Sunucu hatası — yeşil kutu göründüyse bildirimler kısmen çalışıyor');
    } finally {
      setTesting(false);
    }
  }

  async function createOrRefreshSubscription(forceNew: boolean) {
    const keyRes = await fetch('/api/push/vapid-public-key', { cache: 'no-store' });
    const keyBody = (await keyRes.json()) as { ok: boolean; publicKey: string | null; message?: string };
    if (!keyRes.ok || !keyBody.ok || !keyBody.publicKey) {
      setStatus('missing-keys');
      setHint(keyBody.message ?? 'Sunucuda VAPID anahtarları tanımlı değil');
      return;
    }

    const permission = await Notification.requestPermission();
    if (permission !== 'granted') {
      setStatus('denied');
      setHint(
        permission === 'denied'
          ? 'Bildirim izni reddedildi — adres çubuğundaki kilit simgesinden izin verin'
          : 'Bildirim izni verilmedi',
      );
      return;
    }

    setHint(forceNew ? 'Yeniden kaydediliyor…' : 'Abonelik oluşturuluyor…');
    const reg = await ensureServiceWorker();
    if (!('pushManager' in reg)) {
      setStatus('unsupported');
      setHint('Bu tarayıcı push bildirimlerini desteklemiyor');
      return;
    }

    let sub = await reg.pushManager.getSubscription();

    if (forceNew && sub) {
      try {
        await sub.unsubscribe();
      } catch {
        // Eski abonelik kaldırılamasa bile yeni kayıt denenecek
      }
      sub = null;
    }

    if (!sub) {
      sub = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(keyBody.publicKey),
      });
    }

    const count = await syncSubscriptionToServer(sub);
    await refreshServerCount();
    await showLocalNotification(forceNew ? 'Yeniden kayıt tamam' : 'Bildirimler açıldı');

    const { status: sendStatus, body: sendBody } = await pushTestFromServer();
    setStatus('ready');
    if (sendStatus === 200 && sendBody.ok && (sendBody.sent ?? 0) > 0) {
      setHint(
        count >= 0
          ? `Kayıt tamam (${count} cihaz) — macOS sağ üst köşeyi kontrol edin`
          : 'Kayıt tamam — macOS sağ üst köşeyi kontrol edin',
      );
    } else {
      setHint(
        count >= 0
          ? `Sunucuya kaydedildi (${count} cihaz) — Test bildirimi ile tekrar deneyin`
          : 'Kayıt tamam — Test bildirimi ile tekrar deneyin',
      );
    }
  }

  async function subscribe(forceNew = false) {
    if (status === 'subscribing') return;

    const previousStatus = status;
    setStatus('subscribing');
    setHint(forceNew ? 'Yeniden kaydediliyor…' : 'İzin isteniyor…');

    try {
      await createOrRefreshSubscription(forceNew);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Bildirim açılamadı — sayfayı yenileyip tekrar deneyin';
      if (Notification.permission === 'granted') {
        setStatus(previousStatus === 'ready' ? 'ready' : 'idle');
      } else {
        setStatus('denied');
      }
      setHint(message);
    }
  }

  if (status === 'unsupported') {
    return hint ? <p className="roomio-hk-push-hint">{hint}</p> : null;
  }

  const busy = status === 'subscribing';
  const ready = status === 'ready';
  const needsInstall = status === 'needs-install';

  return (
    <div className="roomio-hk-push">
      <div className="roomio-hk-push__actions">
        <button
          type="button"
          className="roomio-btn roomio-btn--ghost roomio-btn--sm"
          onClick={() => void subscribe(ready)}
          disabled={busy || needsInstall}
          title={hint ?? 'HK görev bildirimleri'}
          aria-busy={busy}
        >
          {busy ? <Loader2 size={16} className="roomio-hk-push__spin" /> : ready ? <Bell size={16} /> : <BellOff size={16} />}
          {busy ? (ready ? 'Kaydediliyor…' : 'Açılıyor…') : ready ? 'Yeniden kaydol' : 'Bildirimleri aç'}
        </button>
        {ready || Notification.permission === 'granted' ? (
          <button
            type="button"
            className="roomio-btn roomio-btn--ghost roomio-btn--sm"
            onClick={() => void sendTestNotification()}
            disabled={testing || busy}
          >
            {testing ? 'Gönderiliyor…' : 'Test bildirimi'}
          </button>
        ) : null}
      </div>
      {serverCount !== null ? (
        <p className="roomio-hk-push-hint roomio-hk-push-hint--meta">Sunucu: {serverCount} kayıtlı cihaz</p>
      ) : null}
      {hint ? <p className="roomio-hk-push-hint">{hint}</p> : null}
    </div>
  );
}
