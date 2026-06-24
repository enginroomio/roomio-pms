'use client';

import { useCallback, useEffect, useState } from 'react';
import { useProperty } from '@/components/property/PropertyProvider';
import { roomioFetch } from '@/lib/client/api';
import { parseApiError } from '@/lib/client/api-errors';

export function useFolioBalances(reservationIds: string[]) {
  const { propertyId } = useProperty();
  const [balances, setBalances] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const key = reservationIds.slice().sort().join(',');

  const reload = useCallback(async () => {
    if (!key) {
      setBalances({});
      setError(null);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const res = await roomioFetch(`/api/folio?ids=${encodeURIComponent(key)}`, { cache: 'no-store' });
      if (!res.ok) throw new Error(await parseApiError(res, 'Folyo yüklenemedi'));
      const json = (await res.json()) as { balances?: Record<string, number> };
      setBalances(json.balances ?? {});
    } catch (err) {
      setBalances({});
      setError(err instanceof Error ? err.message : 'Folyo yüklenemedi');
    } finally {
      setLoading(false);
    }
  }, [key]);

  useEffect(() => {
    void reload();
  }, [reload, propertyId]);

  return { balances, loading, error, reload };
}

export type FolioDetail = {
  guestBalance: number;
  companyBalance: number;
  guestLines: number;
  companyLines: number;
};

export function useFolioDetail(reservationId: string | undefined) {
  const { propertyId } = useProperty();
  const [detail, setDetail] = useState<FolioDetail | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const reload = useCallback(async () => {
    if (!reservationId) {
      setDetail(null);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const res = await roomioFetch(
        `/api/folio?reservationId=${encodeURIComponent(reservationId)}&split=1`,
        { cache: 'no-store' },
      );
      if (!res.ok) throw new Error(await parseApiError(res, 'Folyo özeti yüklenemedi'));
      const json = (await res.json()) as {
        guest?: { balance?: number; lines?: unknown[] };
        company?: { balance?: number; lines?: unknown[] };
      };
      setDetail({
        guestBalance: json.guest?.balance ?? 0,
        companyBalance: json.company?.balance ?? 0,
        guestLines: json.guest?.lines?.length ?? 0,
        companyLines: json.company?.lines?.length ?? 0,
      });
    } catch (err) {
      setDetail(null);
      setError(err instanceof Error ? err.message : 'Folyo özeti yüklenemedi');
    } finally {
      setLoading(false);
    }
  }, [reservationId]);

  useEffect(() => {
    void reload();
  }, [reload, propertyId]);

  return { detail, loading, error, reload };
}
