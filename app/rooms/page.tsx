import { Suspense } from 'react';
import { RoomsPageClient } from './RoomsPageClient';
import { getDashboardSnapshot } from '@/lib/server/dashboard-data';

export default async function RoomsRackPage() {
  const snapshot = await getDashboardSnapshot();

  return (
    <Suspense fallback={<div className="roomio-page-desc" style={{ padding: 24 }}>Oda rack yükleniyor…</div>}>
      <RoomsPageClient
        reservations={snapshot.reservations}
        businessDate={snapshot.businessDate}
        hkMap={snapshot.hkMap}
      />
    </Suspense>
  );
}
