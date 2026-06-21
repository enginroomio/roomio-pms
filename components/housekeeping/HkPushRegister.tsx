'use client';

import { useCallback, useEffect, useState } from 'react';
import { Bell, BellOff, Loader2 } from 'lucide-react';
import { browserHasPushSubscription, showHkBrowserNotification } from '@/lib/client/show-hk-notification';
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
  const [browserLinked, setBrowserLinked] = useState<boolean | null>(null);

  const refreshBrowserLinked = useCallback(async () => {
    const linked = await browserHasPushSubscription();
    setBrowserLinked(linked);
    if (linked && Notification.permission === 'granted') {
      setStatus('ready');
    }
    return linked;
  }, []);

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
        errors?: string[];
      },
    };
  }

  async function syncBrowserSubscriptionToServer(): Promise<boolean> {
    const reg = await ensureServiceWorker();
    if (!('pushManager' in reg)) return false;
    const existing = await reg.pushManager.getSubscription();
    if (!existing) return false;

    const count = await syncSubscriptionToServer(existing);
    await refreshServerCount();
    await refreshBrowserLinked();
    setStatus('ready');
    setHint(
      count >= 0
        ? `Tarayıcı + sunucu eşleşti (${count} cihaz) — Test bildirimi deneyin`
        : 'Tarayıcı + sunucu eşleşti — Test bildirimi deneyin',
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
      const [count, linked] = await Promise.all([refreshServerCount(), refreshBrowserLinked()]);
      try {
        if (linked) {
          const synced = await syncBrowserSubscriptionToServer();
          if (synced) return;
        }
        if (count > 0 && !linked) {
          setHint('Sunucuda kayıt var ama BU tarayıcı bağlı değil — Bildirimleri aç');
        } else if (!linked && Notification.permission === 'granted') {
          setHint('Bildirim izni var — Bildirimleri aç ile kaydolun');
        } else if (!linked) {
          setHint('Bildirimleri aç ile başlayın');
        }
      } catch (err) {
        setHint(err instanceof Error ? err.message : 'Kayıt hatası — Bildirimleri aç');
      }
    })();
  }, [refreshBrowserLinked, refreshServerCount]);

  async function sendLocalTestOnly() {
    setTesting(true);
    const title = 'Roomio Yerel Test';
    const body = 'Mac sağ üstte bu metin görünmeli';
    emitHkPushAlert({ title, body });
    const ok = await showHkBrowserNotification(body, title);
    setHint(
      ok
        ? 'Yerel bildirim gönderildi — Mac sağ üst / Bildirim Merkezi. Görmüyorsanız: Sistem Ayarları → Bildirimler → Google Chrome → Uyarılar'
        : 'Yerel bildirim başarısız — izin veya Chrome bildirim ayarını kontrol edin',
    );
    setTesting(false);
  }

  async function sendTestNotification() {
    setTesting(true);
    const title = 'Roomio HK Test';
    const body = 'Bildirimler çalışıyor — Oda 108 kirli';
    emitHkPushAlert({ title, body });

    const linked = await refreshBrowserLinked();
    if (!linked) {
      setHint('Tarayıcı kaydı yok — önce Bildirimleri aç, sonra test edin');
      setTesting(false);
      return;
    }

    setHint('Test gönderiliyor…');

    try {
      const localOk = await showHkBrowserNotification(body, title);
      const { status: httpStatus, body: sendBody } = await pushTestFromServer();
      await refreshServerCount();

      if (localOk && httpStatus === 200 && sendBody.ok && (sendBody.sent ?? 0) > 0) {
        setHint('Tamam — yeşil kutu + yerel + sunucu push (sağ üst)');
        return;
      }
      if (localOk) {
        setHint('Yerel bildirim OK (sağ üst). Sunucu: ' + (sendBody.message ?? `sent=${sendBody.sent ?? 0}`));
        return;
      }
      if (httpStatus === 200 && sendBody.ok && (sendBody.sent ?? 0) > 0) {
        setHint('Sunucu push gönderdi — arka planda sağ üst / Bildirim Merkezi');
        return;
      }
      if ((sendBody.failed ?? 0) > 0 && sendBody.errors?.length) {
        setHint(`Push hatası: ${sendBody.errors[0]} — Yeniden kaydol`);
        return;
      }
      setHint(sendBody.message ?? 'Test tamamlanamadı — önce Yerel test deneyin');
    } catch {
      setHint('Sunucu hatası — Yerel test ile Mac ayarını kontrol edin');
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
          ? 'Bildirim izni reddedildi — kilit simgesinden İzin ver'
          : 'Bildirim izni verilmedi',
      );
      return;
    }

    setHint(forceNew ? 'Yeniden kaydediliyor…' : 'Kaydediliyor…');
    const reg = await ensureServiceWorker();
    if (!('pushManager' in reg)) {
      setStatus('unsupported');
      setHint('Bu tarayıcı push bildirimlerini desteklemiyor');
      return;
    }

    if (forceNew) {
      const sub = await reg.pushManager.getSubscription();
      if (sub) {
        try {
          await sub.unsubscribe();
        } catch {
          // devam
        }
      }
    }

    let sub = await reg.pushManager.getSubscription();
    if (!sub) {
      sub = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(keyBody.publicKey),
      });
    }

    const count = await syncSubscriptionToServer(sub);
    await refreshServerCount();
    await refreshBrowserLinked();
    await showHkBrowserNotification(forceNew ? 'Yeniden kayıt tamam' : 'Bildirimler açıldı', 'Roomio HK');

    const { status: sendStatus, body: sendBody } = await pushTestFromServer();
    setStatus('ready');
    if (sendStatus === 200 && sendBody.ok && (sendBody.sent ?? 0) > 0) {
      setHint(`Kayıt tamam — tarayıcı bağlı, sunucu ${count} cihaz. Sağ üst köşeyi kontrol edin.`);
    } else {
      setHint(`Kayıt sunucuda (${count} cihaz). Yerel test veya Test bildirimi deneyin.`);
    }
  }

  async function subscribe(forceNew = false) {
    if (status === 'subscribing') return;

    const previousStatus = status;
    setStatus('subscribing');

    try {
      await createOrRefreshSubscription(forceNew);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Kayıt başarısız — sayfayı yenileyin';
      setStatus(previousStatus === 'ready' ? 'ready' : 'idle');
      setHint(message);
    }
  }

  if (status === 'unsupported') {
    return hint ? <p className="roomio-hk-push-hint">{hint}</p> : null;
  }

  const busy = status === 'subscribing';
  const ready = status === 'ready';
  const needsInstall = status === 'needs-install';
  const canTest = Notification.permission === 'granted' || ready;

  return (
    <div className="roomio-hk-push">
      <div className="roomio-hk-push__actions">
        <button
          type="button"
          className="roomio-btn roomio-btn--ghost roomio-btn--sm"
          onClick={() => void subscribe(ready || browserLinked === true)}
          disabled={busy || needsInstall}
          aria-busy={busy}
        >
          {busy ? <Loader2 size={16} className="roomio-hk-push__spin" /> : ready ? <Bell size={16} /> : <BellOff size={16} />}
          {busy ? 'Kaydediliyor…' : ready || browserLinked ? 'Yeniden kaydol' : 'Bildirimleri aç'}
        </button>
        {canTest ? (
          <>
            <button
              type="button"
              className="roomio-btn roomio-btn--ghost roomio-btn--sm"
              onClick={() => void sendLocalTestOnly()}
              disabled={testing || busy}
            >
              Yerel test
            </button>
            <button
              type="button"
              className="roomio-btn roomio-btn--ghost roomio-btn--sm"
              onClick={() => void sendTestNotification()}
              disabled={testing || busy}
            >
              {testing ? '…' : 'Test bildirimi'}
            </button>
          </>
        ) : null}
      </div>
      {serverCount !== null || browserLinked !== null ? (
        <p className="roomio-hk-push-hint roomio-hk-push-hint--meta">
          Sunucu: {serverCount ?? '?'} cihaz · Tarayıcı: {browserLinked ? 'bağlı ✓' : 'bağlı değil ✗'}
        </p>
      ) : null}
      {hint ? <p className="roomio-hk-push-hint">{hint}</p> : null}
    </div>
  );
}
