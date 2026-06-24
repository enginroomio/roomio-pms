'use client';

import { ReservationFnBar } from '@/components/reservations/ReservationFnBar';
import { ReservationFolioOpsSummary } from '@/components/reservations/ReservationFolioOpsSummary';
import { ReservationGraphicCalendar } from '@/components/reservations/ReservationGraphicCalendar';
import { ReservationModuleTabs } from '@/components/reservations/ReservationModuleTabs';

/** URL parametreli içerik — üst sayfa kabuğu hemen render olur. */
export function ReservationCalendarContent() {
  return (
    <>
      <ReservationModuleTabs />
      <ReservationFolioOpsSummary />
      <ReservationGraphicCalendar />
      <ReservationFnBar />
    </>
  );
}
