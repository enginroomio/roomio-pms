'use client';

import { Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { PageHeader } from '@/components/PageHeader';
import { Button } from '@/components/ui';
import { ReservationFormWizard } from '@/components/forms/ReservationFormWizard';

function NewReservationContent() {
  const searchParams = useSearchParams();
  const fixRoomNo = searchParams.get('fixRoomNo') ?? undefined;
  const checkIn = searchParams.get('checkIn') ?? undefined;

  return (
    <PageHeader
      breadcrumb="Rezervasyon > Yeni Rezervasyon Kaydı"
      title="Yeni Rezervasyon"
      description="Elektra screen-038 uyumlu sihirbaz — EGM kimlik adımı ve misafir arşivi otomatik doldurma."
      actions={
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          <Button variant="secondary" href="/reports?tab=forms">Form tasarımı</Button>
          <Button variant="secondary" href="/reservations">← Listeye dön</Button>
        </div>
      }
    >
      <ReservationFormWizard seed={{ fixRoomNo, checkIn }} />
    </PageHeader>
  );
}

export default function NewReservationPage() {
  return (
    <Suspense fallback={<div className="roomio-page-desc" style={{ padding: 24 }}>Yükleniyor…</div>}>
      <NewReservationContent />
    </Suspense>
  );
}
