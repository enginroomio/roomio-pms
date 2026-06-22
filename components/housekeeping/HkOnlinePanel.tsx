'use client';

import { useCallback, useEffect, useState } from 'react';
import { HK_ONLINE_REFRESH_EVENT } from '@/lib/client/hk-online-refresh';

type HkSubscriber = {
  id: string;
  deviceLabel: string;
  online: boolean;
  lastSeenAt: string | null;
};

export function HkOnlinePanel({ compact = false }: { compact?: boolean }) {
  const [subscribers, setSubscribers] = useState<HkSubscriber[]>([]);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    try {
      const res = await fetch('/api/push/subscribe?role=hk&detail=1', { cache: 'no-store' });
      const body = (await res.json()) as { ok?: boolean; subscribers?: HkSubscriber[] };
      if (body.ok && body.subscribers) {
        setSubscribers(body.subscribers);
      }
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void refresh();
    const id = window.setInterval(() => void refresh(), 15_000);
    const onVisible = () => {
      if (document.visibilityState === 'visible') void refresh();
    };
    const onOnlineRefresh = () => void refresh();

    document.addEventListener('visibilitychange', onVisible);
    window.addEventListener(HK_ONLINE_REFRESH_EVENT, onOnlineRefresh);

    return () => {
      window.clearInterval(id);
      document.removeEventListener('visibilitychange', onVisible);
      window.removeEventListener(HK_ONLINE_REFRESH_EVENT, onOnlineRefresh);
    };
  }, [refresh]);

  const onlineCount = subscribers.filter((s) => s.online).length;
  const registeredCount = subscribers.length;

  if (loading && registeredCount === 0) {
    return <p className={`roomio-hk-online${compact ? ' roomio-hk-online--compact' : ''}`}>Mobil bağlantı kontrol ediliyor…</p>;
  }

  return (
    <div className={`roomio-hk-online${compact ? ' roomio-hk-online--compact' : ''}`}>
      <p className="roomio-hk-online__summary">
        Kayıtlı: <strong>{registeredCount}</strong> · Online: <strong>{onlineCount}</strong>
      </p>
      {!compact && subscribers.length > 0 ? (
        <ul className="roomio-hk-online__list">
          {subscribers.map((s) => (
            <li key={s.id}>
              <span className={`roomio-hk-staff-dot${s.online ? ' is-active' : ''}`} aria-hidden />
              <span>{s.deviceLabel}</span>
              <small>{s.online ? 'Online' : 'Offline'}</small>
            </li>
          ))}
        </ul>
      ) : null}
      {!compact && subscribers.length === 0 ? (
        <p className="roomio-hk-online__empty">Henüz kayıtlı HK mobil cihaz yok</p>
      ) : null}
      {compact && subscribers.length > 0 ? (
        <p className="roomio-hk-online__chips">
          {subscribers.map((s) => (
            <span key={s.id} className={s.online ? 'is-online' : ''}>
              {s.deviceLabel}
            </span>
          ))}
        </p>
      ) : null}
    </div>
  );
}
