'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { PageHeader } from '@/components/PageHeader';
import { FormActions, FormField, FormGrid, FormSection, Input } from '@/components/kit';
import { Button } from '@/components/ui';
import { roomioFetch } from '@/lib/client/api';
import { DEFAULT_RESTAURANT_BOOKING_CONFIG, type RestaurantBookingConfig } from '@/lib/integrations/restaurant-booking/types';

export default function RestaurantBookingSettingsPage() {
  const [config, setConfig] = useState<RestaurantBookingConfig>(DEFAULT_RESTAURANT_BOOKING_CONFIG);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    void roomioFetch('/api/integrations/restaurant-booking/config')
      .then((r) => r.json())
      .then((j: RestaurantBookingConfig) => setConfig({ ...DEFAULT_RESTAURANT_BOOKING_CONFIG, ...j }));
  }, []);

  async function save() {
    await roomioFetch('/api/integrations/restaurant-booking/config', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(config),
    });
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  return (
    <PageHeader
      breadcrumb="Ayarlar > Restoran Rezervasyon"
      title="Restoran Rezervasyon"
      description="Online masa rezervasyonu, çalışma saatleri ve kapasite yönetimi."
      actions={<Button variant="secondary" href="/settings/integrations">← Entegrasyonlar</Button>}
    >
      <FormSection title="Restoran">
        <FormGrid>
          <label className="roomio-field roomio-field--row">
            <input type="checkbox" checked={config.enabled} onChange={(e) => setConfig({ ...config, enabled: e.target.checked })} />
            <span>Entegrasyon aktif</span>
          </label>
          <FormField label="Restoran adı"><Input value={config.restaurantName} onChange={(e) => setConfig({ ...config, restaurantName: e.target.value })} /></FormField>
          <FormField label="Açılış"><Input value={config.openFrom} onChange={(e) => setConfig({ ...config, openFrom: e.target.value })} /></FormField>
          <FormField label="Kapanış"><Input value={config.openTo} onChange={(e) => setConfig({ ...config, openTo: e.target.value })} /></FormField>
          <FormField label="Maks. kişi"><Input type="number" value={config.maxPartySize} onChange={(e) => setConfig({ ...config, maxPartySize: Number(e.target.value) })} /></FormField>
          <label className="roomio-field roomio-field--row">
            <input type="checkbox" checked={config.allowOnlineBooking} onChange={(e) => setConfig({ ...config, allowOnlineBooking: e.target.checked })} />
            <span>Online rezervasyon</span>
          </label>
        </FormGrid>
        <FormActions className="roomio-form-actions--spaced">
          <Button onClick={() => void save()}>Kaydet</Button>
          <Button variant="secondary" href="/restaurant" target="_blank">Canlı önizleme</Button>
        </FormActions>
        {saved ? <p className="roomio-page-desc">Kaydedildi.</p> : null}
        <p className="roomio-page-desc" style={{ marginTop: 12 }}>
          Misafir URL: <Link href="/restaurant">/restaurant</Link> · {config.tables.filter((t) => t.available).length} müsait masa
        </p>
      </FormSection>
    </PageHeader>
  );
}
