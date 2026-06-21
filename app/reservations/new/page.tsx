'use client';

import { PageHeader } from '@/components/PageHeader';
import { Button } from '@/components/ui';
import { ReservationFormWizard } from '@/components/forms/ReservationFormWizard';

export default function NewReservationPage() {
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
      <ReservationFormWizard />
    </PageHeader>
  );
}
