'use client';

import { useCallback, useEffect, useState } from 'react';
import { roomioFetch } from '@/lib/client/api';

export function useEodGrSnapshot(businessDate: string, reportId: string, enabled: boolean) {
  const [text, setText] = useState<string | null>(null);
  const [found, setFound] = useState(false);
  const [loading, setLoading] = useState(false);

  const reload = useCallback(async () => {
    if (!enabled || !businessDate?.trim() || !reportId?.trim()) {
      setText(null);
      setFound(false);
      return;
    }
    setLoading(true);
    try {
      const qs = new URLSearchParams({ businessDate, rpr: reportId });
      const res = await roomioFetch(`/api/eod/gr-snapshot?${qs}`, { cache: 'no-store' });
      if (!res.ok) {
        setText(null);
        setFound(false);
        return;
      }
      const json = (await res.json()) as { found?: boolean; text?: string };
      setFound(Boolean(json.found && json.text));
      setText(json.text ?? null);
    } catch {
      setText(null);
      setFound(false);
    } finally {
      setLoading(false);
    }
  }, [businessDate, reportId, enabled]);

  useEffect(() => {
    void reload();
  }, [reload]);

  return { text, found, loading, reload };
}
