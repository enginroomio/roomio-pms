'use client';

import { useCallback, useEffect, useState } from 'react';
import { useProperty } from '@/components/property/PropertyProvider';
import { roomioFetch } from '@/lib/client/api';
import { parseApiError } from '@/lib/client/api-errors';
import type { CashEntry, KasaCloseRow } from '@/lib/data/cash';

type CashState = {
  entries: CashEntry[];
  summary: { tahsilat: number; openRegisters: number; entries: number };
  registers: KasaCloseRow[];
  loading: boolean;
  error: string | null;
};

export function useCash() {
  const { propertyId } = useProperty();
  const [state, setState] = useState<CashState>({
    entries: [],
    summary: { tahsilat: 0, openRegisters: 0, entries: 0 },
    registers: [],
    loading: true,
    error: null,
  });

  const reload = useCallback(async () => {
    setState((prev) => ({ ...prev, loading: true, error: null }));
    try {
      const [cashRes, regRes] = await Promise.all([
        roomioFetch('/api/cash', { cache: 'no-store' }),
        roomioFetch('/api/cash?view=registers', { cache: 'no-store' }),
      ]);
      if (!cashRes.ok) throw new Error(await parseApiError(cashRes, 'Kasa verisi yüklenemedi'));
      const cashJson = (await cashRes.json()) as {
        entries?: CashEntry[];
        summary?: CashState['summary'];
      };
      const regJson = regRes.ok
        ? ((await regRes.json()) as { registers?: KasaCloseRow[] })
        : { registers: [] };
      setState({
        entries: cashJson.entries ?? [],
        summary: cashJson.summary ?? { tahsilat: 0, openRegisters: 0, entries: 0 },
        registers: regJson.registers ?? [],
        loading: false,
        error: null,
      });
    } catch (err) {
      setState((prev) => ({
        ...prev,
        loading: false,
        error: err instanceof Error ? err.message : 'Beklenmeyen hata',
      }));
    }
  }, []);

  useEffect(() => {
    void reload();
  }, [reload, propertyId]);

  return { ...state, reload };
}
