'use client';

import { useCallback, useEffect, useState } from 'react';
import { GroupReservationsPanel } from '@/components/reservations/GroupReservationsPanel';
import { roomioFetch } from '@/lib/client/api';

type BlocksSummary = {
  groupCount: number;
  openBlocks: number;
  roomsAllotted: number;
  roomsPickedUp: number;
  pickupPct: number;
  dueForRelease: number;
};

export function GroupManagementHub() {
  const [summary, setSummary] = useState<BlocksSummary | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await roomioFetch('/api/reservations/groups?view=summary', { cache: 'no-store' });
      if (!res.ok) return;
      const body = (await res.json()) as { summary?: BlocksSummary };
      setSummary(body.summary ?? null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  return (
    <>
      <div className="roomio-kpi-grid" style={{ marginBottom: 16 }}>
        <div className="roomio-kpi">
          <span className="roomio-kpi-label">Aktif blok</span>
          <strong>{loading ? '…' : summary?.openBlocks ?? 0}</strong>
        </div>
        <div className="roomio-kpi">
          <span className="roomio-kpi-label">Toplam grup</span>
          <strong>{loading ? '…' : summary?.groupCount ?? 0}</strong>
        </div>
        <div className="roomio-kpi">
          <span className="roomio-kpi-label">Pickup</span>
          <strong>
            {loading ? '…' : `${summary?.roomsPickedUp ?? 0}/${summary?.roomsAllotted ?? 0} (%${summary?.pickupPct ?? 0})`}
          </strong>
        </div>
        <div className="roomio-kpi">
          <span className="roomio-kpi-label">Release bekleyen</span>
          <strong>{loading ? '…' : summary?.dueForRelease ?? 0}</strong>
        </div>
      </div>

      <GroupReservationsPanel onChanged={() => void load()} />
    </>
  );
}
