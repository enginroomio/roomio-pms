'use client';

import { useCallback, useEffect, useState } from 'react';
import { roomioFetch } from '@/lib/client/api';
import { HK_MAP_UPDATE_EVENT, type HkMapUpdateDetail } from '@/lib/client/hk-map-sync';
import type { HkRoomRecord } from '@/lib/data/hk-defaults';
import { hkMapFromBoardRows, mergeHkMaps } from '@/lib/housekeeping/hk-map-from-board';
import type { HousekeepingBoardRow } from '@/lib/rooms/inventory';
import type { RoomHkStatus } from '@/lib/types/room';

type Options = {
  /** Sunucudan periyodik çekim (ms). 0 = kapalı */
  pollMs?: number;
};

const DEFAULT_POLL_MS = 20_000;

export function useLiveHkMap(initial: Record<string, HkRoomRecord>, options: Options = {}) {
  const pollMs = options.pollMs ?? DEFAULT_POLL_MS;
  const [hkMap, setHkMap] = useState(initial);

  useEffect(() => {
    setHkMap(initial);
  }, [initial]);

  const applyUpdate = useCallback((roomNo: string, hkStatus: RoomHkStatus) => {
    setHkMap((prev) => ({
      ...prev,
      [roomNo]: {
        ...(prev[roomNo] ?? { hkStatus }),
        hkStatus,
      },
    }));
  }, []);

  const pullFromServer = useCallback(async () => {
    if (typeof document !== 'undefined' && document.visibilityState !== 'visible') return;
    try {
      const res = await roomioFetch('/api/housekeeping/rooms', { cache: 'no-store' });
      if (!res.ok) return;
      const data = (await res.json()) as { rooms?: HousekeepingBoardRow[] };
      if (!data.rooms?.length) return;
      const remote = hkMapFromBoardRows(data.rooms);
      setHkMap((prev) => mergeHkMaps(prev, remote));
    } catch {
      // Sessiz — yerel olaylar ve push yedek kalır
    }
  }, []);

  useEffect(() => {
    const onDom = (event: Event) => {
      const detail = (event as CustomEvent<HkMapUpdateDetail>).detail;
      if (detail?.roomNo && detail?.hkStatus) applyUpdate(detail.roomNo, detail.hkStatus);
    };

    const bc = typeof BroadcastChannel !== 'undefined' ? new BroadcastChannel('roomio-hk-map') : null;
    const onBc = (event: MessageEvent<HkMapUpdateDetail>) => {
      if (event.data?.roomNo && event.data?.hkStatus) {
        applyUpdate(event.data.roomNo, event.data.hkStatus);
      }
    };

    const onSw = (event: MessageEvent) => {
      const data = event.data as {
        type?: string;
        payload?: { roomNo?: string; hkStatus?: RoomHkStatus };
      };
      if (data?.type === 'roomio-hk-push' && data.payload?.roomNo && data.payload?.hkStatus) {
        applyUpdate(data.payload.roomNo, data.payload.hkStatus);
      }
      if (data?.type === 'roomio-hk-offline' && data.payload?.roomNo && data.payload?.hkStatus) {
        applyUpdate(data.payload.roomNo, data.payload.hkStatus);
      }
    };

    const onVisible = () => {
      if (document.visibilityState === 'visible') void pullFromServer();
    };

    window.addEventListener(HK_MAP_UPDATE_EVENT, onDom);
    bc?.addEventListener('message', onBc);
    document.addEventListener('visibilitychange', onVisible);
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.addEventListener('message', onSw);
    }

    void pullFromServer();

    let pollTimer: number | undefined;
    if (pollMs > 0) {
      pollTimer = window.setInterval(() => void pullFromServer(), pollMs);
    }

    return () => {
      window.removeEventListener(HK_MAP_UPDATE_EVENT, onDom);
      bc?.removeEventListener('message', onBc);
      document.removeEventListener('visibilitychange', onVisible);
      if ('serviceWorker' in navigator) {
        navigator.serviceWorker.removeEventListener('message', onSw);
      }
      if (pollTimer) window.clearInterval(pollTimer);
    };
  }, [applyUpdate, pollMs, pullFromServer]);

  return { hkMap, setHkMap, applyUpdate, pullFromServer };
}
