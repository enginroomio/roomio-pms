'use client';

import { useMemo } from 'react';
import { useFolioBalances } from '@/lib/client/use-folio-balances';
import { useReservations } from '@/lib/client/use-reservations';
import { formatMoney } from '@/lib/data/reception';

/** Konaklayan misafirlerin folyo özeti — grafikler sayfası üst bandı. */
export function ReservationFolioOpsSummary() {
  const { reservations, loading, error } = useReservations();
  const inHouseIds = useMemo(
    () => reservations.filter((r) => r.status === 'CHECKED_IN').map((r) => r.id),
    [reservations],
  );
  const { balances, loading: folioLoading, error: folioError } = useFolioBalances(inHouseIds);

  const totalOpen = useMemo(
    () => Object.values(balances).reduce((sum, b) => sum + (b > 0 ? b : 0), 0),
    [balances],
  );
  const withBalance = useMemo(
    () => Object.values(balances).filter((b) => b > 0).length,
    [balances],
  );

  if (error || folioError) {
    return (
      <p className="roomio-page-desc roomio-text-warn" role="alert" style={{ marginBottom: 16 }}>
        Folyo özeti yüklenemedi: {error ?? folioError}
      </p>
    );
  }

  return (
    <div className="roomio-kpi-grid" style={{ gridTemplateColumns: 'repeat(3, 1fr)', marginBottom: 16 }}>
      <div className="roomio-kpi">
        <div className="roomio-kpi-label">Konaklayan</div>
        <div className="roomio-kpi-value">{loading ? '…' : inHouseIds.length}</div>
      </div>
      <div className="roomio-kpi">
        <div className="roomio-kpi-label">Açık folyo toplamı</div>
        <div className="roomio-kpi-value roomio-text-warn">
          {loading || folioLoading ? '…' : formatMoney(totalOpen)}
        </div>
      </div>
      <div className="roomio-kpi">
        <div className="roomio-kpi-label">Bakiyeli hesap</div>
        <div className="roomio-kpi-value">{loading || folioLoading ? '…' : withBalance}</div>
      </div>
    </div>
  );
}
