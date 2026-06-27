'use client';

import { useEffect, useRef, useState } from 'react';
import { useProperty } from '@/components/property/PropertyProvider';
import { roomioFetch } from '@/lib/client/api';
import type { HkRoomRecord } from '@/lib/data/hk-defaults';
import type { DashboardSnapshot } from '@/lib/server/dashboard-data';
import type { Reservation } from '@/lib/types/reservation';

/** Şube değişince /api/dashboard canlı yenilenir */
export function useDashboardSnapshot(initial: DashboardSnapshot) {
  const { propertyId } = useProperty();
  const [snapshot, setSnapshot] = useState<DashboardSnapshot>(initial);
  const [loading, setLoading] = useState(false);
  const skipInitial = useRef(true);

  useEffect(() => {
    if (skipInitial.current) {
      skipInitial.current = false;
      return;
    }
    let cancelled = false;
    setLoading(true);
    void roomioFetch('/api/dashboard', { cache: 'no-store' })
      .then((r) => r.json())
      .then((j: DashboardSnapshot & { ok?: boolean }) => {
        if (cancelled || !j.reservations) return;
        setSnapshot({
          businessDate: j.businessDate,
          reservations: j.reservations,
          hkMap: j.hkMap as Record<string, HkRoomRecord>,
          cells: j.cells,
          counts: j.counts,
          totalRooms: j.totalRooms,
          inHouse: j.inHouse,
          arrivals: j.arrivals as Reservation[],
          departures: j.departures as Reservation[],
          occupancy: j.occupancy,
          cleanVacant: j.cleanVacant,
          dirtyVacant: j.dirtyVacant,
        });
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [propertyId]);

  return { snapshot, loading, propertyId };
}
