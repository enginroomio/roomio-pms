'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { IntegrationPageLayout } from '@/components/sistem/IntegrationPageLayout';
import { FormActions, FormField, FormGrid, FormSection, Input } from '@/components/kit';
import { Button } from '@/components/ui';
import { roomioFetch } from '@/lib/client/api';
import { DEFAULT_BOOKING_ENGINE_CONFIG, type BookingEngineConfig } from '@/lib/booking-engine/types';

export default function BookingEngineSettingsPage() {
  const [config, setConfig] = useState<BookingEngineConfig>(DEFAULT_BOOKING_ENGINE_CONFIG);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    void roomioFetch('/api/booking/config').then((r) => r.json()).then((j: BookingEngineConfig) => {
      setConfig({ ...DEFAULT_BOOKING_ENGINE_CONFIG, ...j });
    });
  }, []);

  async function save() {
    await roomioFetch('/api/booking/config', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(config),
    });
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  return (
    <IntegrationPageLayout
      segment={"Online Rezervasyon Motoru"}
      title={"Online Rezervasyon Motoru"}
      description={"Komisyonsuz direkt satış, Google/trivago entegrasyonu ve Sanal POS."}
      >
      <FormSection title="Genel">
        <FormGrid>
          <label className="roomio-field roomio-field--row">
            <input type="checkbox" checked={config.enabled} onChange={(e) => setConfig({ ...config, enabled: e.target.checked })} />
            <span>Motor aktif</span>
          </label>
          <FormField label="Otel adı"><Input value={config.hotelName} onChange={(e) => setConfig({ ...config, hotelName: e.target.value })} /></FormField>
          <FormField label="Başlık"><Input value={config.headline} onChange={(e) => setConfig({ ...config, headline: e.target.value })} /></FormField>
          <FormField label="Varsayılan rate plan"><Input value={config.defaultRatePlan} onChange={(e) => setConfig({ ...config, defaultRatePlan: e.target.value })} /></FormField>
          <FormField label="Pansiyon"><Input value={config.defaultMealPlan} onChange={(e) => setConfig({ ...config, defaultMealPlan: e.target.value })} /></FormField>
          <label className="roomio-field roomio-field--row">
            <input type="checkbox" checked={config.allowVirtualPos} onChange={(e) => setConfig({ ...config, allowVirtualPos: e.target.checked })} />
            <span>Sanal POS</span>
          </label>
          <label className="roomio-field roomio-field--row">
            <input type="checkbox" checked={config.googleHotelEnabled} onChange={(e) => setConfig({ ...config, googleHotelEnabled: e.target.checked })} />
            <span>Google Hotel</span>
          </label>
          <label className="roomio-field roomio-field--row">
            <input type="checkbox" checked={config.trivagoEnabled} onChange={(e) => setConfig({ ...config, trivagoEnabled: e.target.checked })} />
            <span>trivago</span>
          </label>
          <label className="roomio-field roomio-field--row">
            <input type="checkbox" checked={config.loyaltyEnabled} onChange={(e) => setConfig({ ...config, loyaltyEnabled: e.target.checked })} />
            <span>Sadakat / bonus</span>
          </label>
        </FormGrid>
        <FormActions className="roomio-form-actions--spaced">
          <Button onClick={() => void save()}>Kaydet</Button>
          <Button variant="secondary" href="/book" target="_blank">Canlı önizleme</Button>
        </FormActions>
        {saved ? <p className="roomio-page-desc">Kaydedildi.</p> : null}
        <p className="roomio-page-desc" style={{ marginTop: 12 }}>
          Misafir sayfası: <Link href="/book">/book</Link>
        </p>
      </FormSection>
    </IntegrationPageLayout>
  );
}
