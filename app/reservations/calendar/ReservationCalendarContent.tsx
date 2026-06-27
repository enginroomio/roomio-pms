'use client';

import { ReservationGraphicCalendar } from '@/components/reservations/ReservationGraphicCalendar';
import { ReservationModuleTabs } from '@/components/reservations/ReservationModuleTabs';

/** F1 grafik — tek ekran, Forecast alanı kalan yüksekliği doldurur. */
export function ReservationCalendarContent() {
  return (
    <div className="roomio-grafik-f1-shell">
      <ReservationModuleTabs compact />
      <ReservationGraphicCalendar fullScreen />
    </div>
  );
}
