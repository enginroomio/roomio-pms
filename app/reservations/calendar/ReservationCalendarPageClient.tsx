'use client';

import { useSearchParams } from 'next/navigation';
import { ReservationCalendarContent } from './ReservationCalendarContent';
import { RezervasyonModuleLayout } from '@/components/rezervasyon/RezervasyonModuleLayout';

export function ReservationCalendarPageClient() {
  const searchParams = useSearchParams();
  const mode = searchParams.get('mode');
  const menuSearch = mode ? `?mode=${mode}` : '';

  return (
    <RezervasyonModuleLayout
      segment="Grafikler (F1)"
      title="Grafikler"
      description="Elektra v5 Forecast — canlı doluluk"
      menuSearch={menuSearch}
    >
      <div className="roomio-page-stack roomio-page-stack--grafik-f1">
        <ReservationCalendarContent />
      </div>
    </RezervasyonModuleLayout>
  );
}
