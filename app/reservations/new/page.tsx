'use client';

import { Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { ReservationFormWizard } from '@/components/forms/ReservationFormWizard';
import { RezervasyonModuleLayout } from '@/components/rezervasyon/RezervasyonModuleLayout';

function NewReservationContent() {
  const searchParams = useSearchParams();
  const fixRoomNo = searchParams.get('fixRoomNo') ?? undefined;
  const checkIn = searchParams.get('checkIn') ?? undefined;

  return (
    <RezervasyonModuleLayout
      segment="Yeni Rezervasyon"
      title="Yeni Rezervasyon"
      hideTitle
      menuSearch=""
    >
      <div className="roomio-page-stack roomio-page-stack--rez-new">
        <ReservationFormWizard seed={{ fixRoomNo, checkIn }} />
      </div>
    </RezervasyonModuleLayout>
  );
}

export default function NewReservationPage() {
  return (
    <Suspense fallback={<div className="roomio-page-desc" style={{ padding: 24 }}>Yükleniyor…</div>}>
      <NewReservationContent />
    </Suspense>
  );
}
