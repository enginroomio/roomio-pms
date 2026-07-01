'use client';

import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { ReservationGraphicCalendar } from '@/components/reservations/ReservationGraphicCalendar';

/** F1 grafik — Forecast alanı kalan yüksekliği doldurur. */
export function ReservationCalendarContent() {
  const searchParams = useSearchParams();
  const filterWizard = searchParams.get('mode') === 'filter-wizard';

  return (
    <div className="roomio-grafik-f1-shell">
      <nav className="roomio-tabs roomio-tabs--compact" aria-label="Grafik görünümü" style={{ marginBottom: 8 }}>
        <Link
          href="/reservations/calendar"
          className={`roomio-tab${!filterWizard ? ' is-active' : ''}`}
        >
          Forecast (F1)
        </Link>
        <Link
          href="/reservations/calendar?mode=filter-wizard"
          className={`roomio-tab${filterWizard ? ' is-active' : ''}`}
        >
          Filtre sihirbazı
        </Link>
      </nav>
      <ReservationGraphicCalendar fullScreen />
    </div>
  );
}
