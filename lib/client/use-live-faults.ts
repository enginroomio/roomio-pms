'use client';

import { useCallback, useEffect, useState } from 'react';
import { roomioFetch } from '@/lib/client/api';
import { HK_FAULT_UPDATE_EVENT, type HkFaultUpdateDetail } from '@/lib/client/fault-sync';
import type { RoomFault } from '@/lib/server/fault-service';

const POLL_MS = 20_000;

export function useLiveFaults(initial: RoomFault[] = []) {
  const [faults, setFaults] = useState<RoomFault[]>(initial);

  const pull = useCallback(async () => {
    if (typeof document !== 'undefined' && document.visibilityState !== 'visible') return;
    try {
      const res = await roomioFetch('/api/housekeeping/faults?status=active', { cache: 'no-store' });
      if (!res.ok) return;
      const data = (await res.json()) as { faults?: RoomFault[] };
      if (data.faults) setFaults(data.faults);
    } catch {
      // yedek: yerel olaylar
    }
  }, []);

  useEffect(() => {
    void pull();
  }, [pull]);

  useEffect(() => {
    const onDom = () => void pull();
    const bc = typeof BroadcastChannel !== 'undefined' ? new BroadcastChannel('roomio-hk-fault') : null;
    const onBc = () => void pull();
    const onVisible = () => {
      if (document.visibilityState === 'visible') void pull();
    };

    window.addEventListener(HK_FAULT_UPDATE_EVENT, onDom);
    bc?.addEventListener('message', onBc);
    document.addEventListener('visibilitychange', onVisible);
    const timer = window.setInterval(() => void pull(), POLL_MS);

    return () => {
      window.removeEventListener(HK_FAULT_UPDATE_EVENT, onDom);
      bc?.removeEventListener('message', onBc);
      document.removeEventListener('visibilitychange', onVisible);
      window.clearInterval(timer);
      bc?.close();
    };
  }, [pull]);

  const upsertFault = useCallback((fault: RoomFault) => {
    setFaults((prev) => {
      const next = prev.filter((f) => f.id !== fault.id);
      if (fault.status !== 'resolved') next.push(fault);
      return next.sort((a, b) => a.roomNo.localeCompare(b.roomNo, 'tr'));
    });
  }, []);

  const removeFault = useCallback((faultId: string) => {
    setFaults((prev) => prev.filter((f) => f.id !== faultId));
  }, []);

  const openFaultForRoom = useCallback(
    (roomNo: string) => faults.find((f) => f.roomNo === roomNo && f.status !== 'resolved'),
    [faults],
  );

  return { faults, pull, upsertFault, removeFault, openFaultForRoom };
}

export function emitFaultClientUpdate(detail: HkFaultUpdateDetail) {
  import('@/lib/client/fault-sync').then(({ emitHkFaultUpdate }) => emitHkFaultUpdate(detail));
}
