'use client';

import { useEffect, useState } from 'react';
import { Bell, BellOff, Loader2 } from 'lucide-react';
import { showHkBrowserNotification } from '@/lib/client/show-hk-notification';

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
    throw new Error(saveBody.message ?? 'Abonelik sunucuya kaydedilemedi');
  }
}

export function HkPushRegister() {
  const [status, setStatus] = useState<PushStatus>('idle');
  const [hint, setHint] = useState<string | null>(null);
  const [testing, setTesting] = useState(false);

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

  async function showLocalNotification(body: string) {
    return showHkBrowserNotification(body);
  }

  async function refreshServerSubscription() {
    const reg = await ensureServiceWorker();
    const existing = await reg.pushManager.getSubscription();
    if (!existing) return false;
    await syncSubscriptionToServer(existing);
    setStatus('ready');
    setHint(null);
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
      try {
        if (await refreshServerSubscription()) return;
      } catch {
        // Tarayıcıda abonelik var ama sunucu sıfırlanmış olabilir — kullanıcı tekrar açsın
      }
    })();
  }, []);

  async function sendTestNotification() {
    setTesting(true);
    setHint('Test bildirimi gönderiliyor…');
    try {
      const localOk = await showLocalNotification('Yerel test — Chrome bildirimleri açık');
      const { status, body } = await pushTestFromServer();

      if (status === 200 && body.ok && (body.sent ?? 0) > 0) {
        setHint(
          localOk
            ? 'Yerel + sunucu bildirimi gönderildi — sağ altta veya macOS Bildirim Merkezi'
            : 'Sunucu bildirimi gönderildi (sent=1) — macOS Bildirim Merkezi\'ni kontrol edin',
        );
        return;
      }
      if (body.message?.includes('Kayıtlı cihaz yok')) {
        setStatus('idle');
        setHint('Sunucuda kayıt yok — Bildirimleri aç ile tekrar kaydolun');
        return;
      }
      if (localOk) {
        setHint('Yerel bildirim göründü; sunucu push başarısız — Bildirimleri tekrar açın');
        return;
      }
      setHint(body.message ?? 'Bildirim gönderilemedi — Bildirimleri tekrar açın');
    } catch {
      setHint('Test bildirimi gönderilemedi');
    } finally {
      setTesting(false);
    }
  }

  async function subscribe(force = false) {
    if (status === 'subscribing') return;
    if (status === 'ready' && !force) return;

    setStatus('subscribing');
    setHint('İzin isteniyor…');

    try {
      const keyRes = await fetch('/api/push/vapid-public-key');
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

      setHint('Abonelik oluşturuluyor…');
      const reg = await ensureServiceWorker();
      if (!('pushManager' in reg)) {
        setStatus('unsupported');
        setHint('Bu tarayıcı push bildirimlerini desteklemiyor');
        return;
      }

      const existing = await reg.pushManager.getSubscription();
      if (existing) {
        await existing.unsubscribe();
      }

      const sub = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(keyBody.publicKey),
      });

      await syncSubscriptionToServer(sub);
      await showLocalNotification('Bildirimler açıldı');

      const { status: sendStatus, body: sendBody } = await pushTestFromServer();
      setStatus('ready');
      if (sendStatus === 200 && sendBody.ok && (sendBody.sent ?? 0) > 0) {
        setHint('Kayıt tamam — test bildirimi gönderildi (sağ alt / Bildirim Merkezi)');
      } else {
        setHint('Kayıt tamam — Test bildirimi ile tekrar deneyin');
      }
    } catch (err) {
      setStatus('denied');
      setHint(err instanceof Error ? err.message : 'Bildirim açılamadı — sayfayı yenileyip tekrar deneyin');
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
          {busy ? 'Açılıyor…' : ready ? 'Yeniden kaydol' : 'Bildirimleri aç'}
        </button>
        {ready ? (
          <button
            type="button"
            className="roomio-btn roomio-btn--ghost roomio-btn--sm"
            onClick={() => void sendTestNotification()}
            disabled={testing}
          >
            {testing ? 'Gönderiliyor…' : 'Test bildirimi'}
          </button>
        ) : null}
      </div>
      {hint ? <p className="roomio-hk-push-hint">{hint}</p> : null}
    </div>
  );
}
