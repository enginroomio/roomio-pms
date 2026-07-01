'use client';

import { useCallback, useEffect, useState } from 'react';
import { roomioFetch } from '@/lib/client/api';
import type { AuditEntry } from '@/lib/server/audit-log';

export function useEodAuditLogs(businessDate: string, enabled: boolean) {
  const [logs, setLogs] = useState<AuditEntry[]>([]);
  const [loading, setLoading] = useState(false);

  const reload = useCallback(async () => {
    if (!enabled || !businessDate?.trim()) {
      setLogs([]);
      return;
    }
    setLoading(true);
    try {
      const qs = new URLSearchParams({ businessDate, limit: '500' });
      const res = await roomioFetch(`/api/audit?${qs}`, { cache: 'no-store' });
      if (!res.ok) {
        setLogs([]);
        return;
      }
      const json = (await res.json()) as { logs?: AuditEntry[] };
      setLogs(json.logs ?? []);
    } catch {
      setLogs([]);
    } finally {
      setLoading(false);
    }
  }, [businessDate, enabled]);

  useEffect(() => {
    void reload();
  }, [reload]);

  return { logs, loading, reload };
}
