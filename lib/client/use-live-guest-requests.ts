'use client';

import { useCallback, useEffect, useState } from 'react';
import { roomioFetch } from '@/lib/client/api';
import { HK_GUEST_REQUEST_EVENT, type HkGuestRequestUpdateDetail } from '@/lib/client/guest-request-sync';
import type { HkGuestRequestRecord } from '@/lib/server/guest-request-service';

const POLL_MS = 20_000;

/** Misafir talepleri — HK/Resepsiyon değişikliklerinde anında yenilenir */
export function useLiveGuestRequests(initial: HkGuestRequestRecord[] = []) {
  const [requests, setRequests] = useState<HkGuestRequestRecord[]>(initial);

  const pull = useCallback(async () => {
    if (typeof document !== 'undefined' && document.visibilityState !== 'visible') return;
    try {
      const res = await roomioFetch('/api/housekeeping/requests?status=active', { cache: 'no-store' });
      if (!res.ok) return;
      const data = (await res.json()) as { requests?: HkGuestRequestRecord[] };
      if (data.requests) setRequests(data.requests);
    } catch {
      // yedek: yerel olaylar
    }
  }, []);

  const removeRequest = useCallback((requestId: string) => {
    setRequests((prev) => prev.filter((r) => r.id !== requestId));
  }, []);

  useEffect(() => {
    void pull();
  }, [pull]);

  useEffect(() => {
    const onDom = (event: Event) => {
      const detail = (event as CustomEvent<HkGuestRequestUpdateDetail>).detail;
      if (detail?.action === 'completed' && detail.requestId) {
        removeRequest(detail.requestId);
        return;
      }
      void pull();
    };
    const bc = typeof BroadcastChannel !== 'undefined' ? new BroadcastChannel('roomio-hk-guest-request') : null;
    const onBc = (event: MessageEvent<HkGuestRequestUpdateDetail>) => {
      const detail = event.data;
      if (detail?.action === 'completed' && detail.requestId) {
        removeRequest(detail.requestId);
        return;
      }
      void pull();
    };
    const onVisible = () => {
      if (document.visibilityState === 'visible') void pull();
    };

    window.addEventListener(HK_GUEST_REQUEST_EVENT, onDom);
    bc?.addEventListener('message', onBc);
    document.addEventListener('visibilitychange', onVisible);
    const timer = window.setInterval(() => void pull(), POLL_MS);

    return () => {
      window.removeEventListener(HK_GUEST_REQUEST_EVENT, onDom);
      bc?.removeEventListener('message', onBc);
      document.removeEventListener('visibilitychange', onVisible);
      window.clearInterval(timer);
      bc?.close();
    };
  }, [pull, removeRequest]);

  return { requests, pull, removeRequest };
}
