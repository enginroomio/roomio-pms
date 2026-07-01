'use client';

import Link from 'next/link';
import { IntegrationPageLayout } from '@/components/sistem/IntegrationPageLayout';
import { Button } from '@/components/ui';
import { ReservationImportPanel } from '@/components/reservations/ReservationImportPanel';

export default function IcalImportSettingsPage() {
  return (
    <IntegrationPageLayout
      segment="OTA Takvim (iCal)"
      title="OTA Takvim (iCal) Aktarım"
      description="Booking.com ve Expedia'nın dışa aktarılan iCal linklerini kaydedin; rezervasyonları önizleyip sisteme aktarın."
    >
      <div className="roomio-inline-panel" style={{ marginBottom: 16, padding: 12 }}>
        <p className="roomio-page-desc" style={{ margin: 0 }}>
          Her oda tipi için OTA panelinden aldığınız <strong>iCal / takvim URL</strong> adresini ekleyin.
          Çekilen veride genelde yalnızca tarih ve misafir adı bulunur — fiyat, pansiyon ve acenta alanlarını
          aktarmadan önce tabloda tamamlayın.
        </p>
        <div className="roomio-form-actions" style={{ marginTop: 12 }}>
          <Button variant="secondary" href="/reservations?tab=ical">Rezervasyon listesinde aç</Button>
          <Button variant="ghost" href="/settings/integrations/channel-manager">Kanal yöneticisi</Button>
        </div>
      </div>

      <ReservationImportPanel mode="ical" />

      <p className="roomio-page-desc" style={{ marginTop: 16 }}>
        <Link href="/reservations?tab=ical">Rezervasyon › iCal aktarım</Link>
        {' · '}
        <Link href="/settings/integrations/channel-manager">Kanal yöneticisi (API)</Link>
      </p>
    </IntegrationPageLayout>
  );
}
