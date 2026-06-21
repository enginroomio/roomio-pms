import { Suspense } from 'react';
import ReservationCalendarPage from './ReservationCalendarPageClient';

export const dynamic = 'force-dynamic';

export default function Page() {
  return (
    <Suspense fallback={<div className="roomio-page-desc" style={{ padding: 24 }}>Grafikler yükleniyor…</div>}>
      <ReservationCalendarPage />
    </Suspense>
  );
}
