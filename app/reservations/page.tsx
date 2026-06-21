import { Suspense } from 'react';
import { ReservationsPageClient } from './ReservationsPageClient';

export const dynamic = 'force-dynamic';

export default function ReservationsPage() {
  return (
    <Suspense fallback={<div className="roomio-page-desc" style={{ padding: 24 }}>Rezervasyon yükleniyor…</div>}>
      <ReservationsPageClient />
    </Suspense>
  );
}
