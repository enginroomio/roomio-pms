'use client';

import { PageHeader } from '@/components/PageHeader';
import { Button } from '@/components/ui';
import { ReservationFnBar } from '@/components/reservations/ReservationFnBar';
import { ReservationGraphicCalendar } from '@/components/reservations/ReservationGraphicCalendar';
import { ReservationModuleTabs } from '@/components/reservations/ReservationModuleTabs';

export default function ReservationCalendarPageClient() {
  return (
    <PageHeader
      breadcrumb="Rezervasyon › Grafikler (F1)"
      title="Grafikler"
      description="Elektra v5 Forecast — canlı doluluk API, Grafik sekmesi, EGM/TGA/TİS sekmeleri, günlük kurlar."
      actions={
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          <Button variant="secondary" href="/reservations/calendar/mockups">İnteraktif galeri</Button>
          <Button variant="secondary" href="/reservations">Rezervasyon Listesi</Button>
          <Button href="/reservations/new">+ Yeni (F2)</Button>
        </div>
      }
    >
      <ReservationModuleTabs />
      <ReservationGraphicCalendar />
      <ReservationFnBar />
    </PageHeader>
  );
}
