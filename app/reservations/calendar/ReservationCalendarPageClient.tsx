'use client';

import { PageHeader } from '@/components/PageHeader';
import { ReservationCalendarContent } from './ReservationCalendarContent';

export function ReservationCalendarPageClient() {
  return (
    <PageHeader
      breadcrumb="Rezervasyon › Grafikler (F1)"
      title="Grafikler"
      description="Elektra v5 Forecast — canlı doluluk"
      stackClassName="roomio-page-stack--grafik-f1"
    >
      <ReservationCalendarContent />
    </PageHeader>
  );
}
