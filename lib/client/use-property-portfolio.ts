'use client';

import { useEffect, useState } from 'react';
import { useProperty } from '@/components/property/PropertyProvider';
import { roomioFetch } from '@/lib/client/api';

export type PropertyPortfolioRow = {
  propertyId: string;
  code: string;
  name: string;
  city: string | null;
  totalRooms: number;
  checkedIn: number;
  occupancyPct: number;
  arrivalsToday: number;
};

type Portfolio = {
  properties: PropertyPortfolioRow[];
  totals: { properties: number; rooms: number; checkedIn: number };
};

/** Tüm şubelerin canlı KPI özeti (konsolide API) */
export function usePropertyPortfolio() {
  const { propertyId } = useProperty();
  const [data, setData] = useState<Portfolio | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    void roomioFetch('/api/reports/consolidated', { cache: 'no-store' })
      .then((r) => r.json())
      .then((j: Portfolio & { ok?: boolean }) => {
        if (cancelled || !j.properties) return;
        setData({ properties: j.properties, totals: j.totals });
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [propertyId]);

  return { data, loading };
}
