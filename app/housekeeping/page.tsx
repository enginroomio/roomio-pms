import { Suspense } from 'react';
import { HousekeepingPageClient } from './HousekeepingPageClient';
import { getHousekeepingBoardServer } from '@/lib/server/housekeeping-service';

export default async function HousekeepingHubPage() {
  const board = await getHousekeepingBoardServer();

  return (
    <Suspense fallback={<div className="roomio-page-desc" style={{ padding: 24 }}>Kat hizmetleri yükleniyor…</div>}>
      <HousekeepingPageClient initialBoard={board} />
    </Suspense>
  );
}
