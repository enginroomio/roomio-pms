'use client';

import { useCallback, useEffect, useState } from 'react';
import { roomioFetch } from '@/lib/client/api';
import type { EgmIdentityRecord } from '@/lib/egm/types';

export function useEodEgmRecords(enabled: boolean) {
  const [records, setRecords] = useState<EgmIdentityRecord[]>([]);
  const [loading, setLoading] = useState(false);

  const reload = useCallback(async () => {
    if (!enabled) {
      setRecords([]);
      return;
    }
    setLoading(true);
    try {
      const res = await roomioFetch('/api/egm/identity', { cache: 'no-store' });
      if (!res.ok) {
        setRecords([]);
        return;
      }
      const json = (await res.json()) as { records?: EgmIdentityRecord[] };
      setRecords(json.records ?? []);
    } catch {
      setRecords([]);
    } finally {
      setLoading(false);
    }
  }, [enabled]);

  useEffect(() => {
    void reload();
  }, [reload]);

  return { records, loading, reload };
}
