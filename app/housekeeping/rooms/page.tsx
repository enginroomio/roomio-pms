import { Suspense } from 'react';
import HousekeepingRoomsPageClient from './HousekeepingRoomsPageClient';

export default function HousekeepingRoomsPage() {
  return (
    <Suspense fallback={<div className="roomio-page-desc" style={{ padding: 24 }}>Yükleniyor…</div>}>
      <HousekeepingRoomsPageClient />
    </Suspense>
  );
}
