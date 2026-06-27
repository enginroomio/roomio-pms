import { Suspense } from 'react';
import VacantRoomsPageClient from './VacantRoomsPageClient';

export default function VacantRoomsPage() {
  return (
    <Suspense fallback={<div className="roomio-page-desc" style={{ padding: 24 }}>Yükleniyor…</div>}>
      <VacantRoomsPageClient />
    </Suspense>
  );
}
