'use client';

import { useEffect, useState } from 'react';
import { getSyncMeta, isOnline, runSync } from '@/lib/sync/engine';
import type { SyncMeta } from '@/lib/sync/types';

export function SyncStatusBar() {
  const [meta, setMeta] = useState<SyncMeta | null>(null);
  const [syncing, setSyncing] = useState(false);
  const [online, setOnline] = useState(true);

  async function refresh() {
    setOnline(isOnline());
    setMeta(await getSyncMeta());
  }

  useEffect(() => {
    void refresh();
    const onStatus = () => void refresh();
    window.addEventListener('online', onStatus);
    window.addEventListener('offline', onStatus);
    window.addEventListener('roomio-sync-status', onStatus);
    return () => {
      window.removeEventListener('online', onStatus);
      window.removeEventListener('offline', onStatus);
      window.removeEventListener('roomio-sync-status', onStatus);
    };
  }, []);

  async function handleSync() {
    setSyncing(true);
    await runSync();
    await refresh();
    setSyncing(false);
  }

  if (!meta) return null;

  const statusClass = online ? (meta.pendingCount > 0 ? 'warn' : 'ok') : 'offline';
  const label = online
    ? meta.pendingCount > 0
      ? `Senkron bekliyor (${meta.pendingCount})`
      : 'Çevrimiçi'
    : 'Çevrimdışı — yerel kayıt';

  return (
    <div className={`roomio-sync-bar roomio-sync-bar--${statusClass}`}>
      <span className="roomio-sync-dot" aria-hidden />
      <span className="roomio-sync-label">{label}</span>
      {meta.lastSyncAt ? (
        <span className="roomio-sync-meta">Son: {new Date(meta.lastSyncAt).toLocaleTimeString('tr-TR')}</span>
      ) : null}
      <button type="button" className="roomio-sync-btn" onClick={() => void handleSync()} disabled={syncing || !online}>
        {syncing ? 'Senkron…' : 'Senkron'}
      </button>
    </div>
  );
}
