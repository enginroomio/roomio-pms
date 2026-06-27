'use client';

import { useCallback, useEffect, useState } from 'react';
import { useProperty } from '@/components/property/PropertyProvider';
import { roomioFetch } from '@/lib/client/api';
import { parseApiError } from '@/lib/client/api-errors';
import type { Reservation } from '@/lib/types/reservation';

type State = {
  reservations: Reservation[];
  loading: boolean;
  error: string | null;
};

export function useReservations() {
  const { propertyId } = useProperty();
  const [state, setState] = useState<State>({
    reservations: [],
    loading: true,
    error: null,
  });

  const reload = useCallback(async () => {
    setState((prev) => ({ ...prev, loading: true, error: null }));
    try {
      const res = await roomioFetch('/api/reservations', { cache: 'no-store' });
      if (!res.ok) throw new Error(await parseApiError(res, 'Rezervasyonlar yüklenemedi'));
      const json = (await res.json()) as { reservations?: Reservation[] };
      setState({ reservations: json.reservations ?? [], loading: false, error: null });
    } catch (err) {
      setState({
        reservations: [],
        loading: false,
        error: err instanceof Error ? err.message : 'Beklenmeyen hata',
      });
    }
  }, []);

  useEffect(() => {
    void reload();
  }, [reload, propertyId]);

  return { ...state, reload };
}
