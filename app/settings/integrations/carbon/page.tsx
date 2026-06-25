'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { PageHeader } from '@/components/PageHeader';
import { FormActions, FormField, FormGrid, FormSection, Input } from '@/components/kit';
import { Button } from '@/components/ui';
import { roomioFetch } from '@/lib/client/api';
import { DEFAULT_CARBON_CONFIG, type CarbonConfig } from '@/lib/integrations/carbon/types';

export default function CarbonSettingsPage() {
  const [config, setConfig] = useState<CarbonConfig>(DEFAULT_CARBON_CONFIG);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    void roomioFetch('/api/integrations/carbon/config')
      .then((r) => r.json())
      .then((j: CarbonConfig) => setConfig({ ...DEFAULT_CARBON_CONFIG, ...j }));
  }, []);

  async function save() {
    await roomioFetch('/api/integrations/carbon/config', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(config),
    });
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  return (
    <PageHeader
      breadcrumb="Ayarlar > Karbon Ofset"
      title="Karbon Ofset"
      description="Konaklama karbon ayak izi hesaplama ve misafir ofset teklifi."
      actions={<Button variant="secondary" href="/settings/integrations">← Entegrasyonlar</Button>}
    >
      <FormSection title="Ofset">
        <FormGrid>
          <label className="roomio-field roomio-field--row">
            <input type="checkbox" checked={config.enabled} onChange={(e) => setConfig({ ...config, enabled: e.target.checked })} />
            <span>Entegrasyon aktif</span>
          </label>
          <FormField label="Sertifika sağlayıcı"><Input value={config.certificateProvider} onChange={(e) => setConfig({ ...config, certificateProvider: e.target.value })} /></FormField>
          <FormField label="CO₂ / gece (kg)"><Input type="number" step="0.1" value={config.co2PerNightKg} onChange={(e) => setConfig({ ...config, co2PerNightKg: Number(e.target.value) })} /></FormField>
          <FormField label="Ofset maliyeti / kg"><Input type="number" step="0.01" value={config.offsetCostPerKg} onChange={(e) => setConfig({ ...config, offsetCostPerKg: Number(e.target.value) })} /></FormField>
          <FormField label="Para birimi"><Input value={config.currency} onChange={(e) => setConfig({ ...config, currency: e.target.value })} /></FormField>
          <label className="roomio-field roomio-field--row">
            <input type="checkbox" checked={config.autoOfferOnBooking} onChange={(e) => setConfig({ ...config, autoOfferOnBooking: e.target.checked })} />
            <span>Rezervasyonda otomatik teklif</span>
          </label>
          <label className="roomio-field roomio-field--row">
            <input type="checkbox" checked={config.showGuestBadge} onChange={(e) => setConfig({ ...config, showGuestBadge: e.target.checked })} />
            <span>Misafir rozeti göster</span>
          </label>
        </FormGrid>
        <FormActions className="roomio-form-actions--spaced">
          <Button onClick={() => void save()}>Kaydet</Button>
          <Button variant="secondary" href="/carbon" target="_blank">Canlı önizleme</Button>
        </FormActions>
        {saved ? <p className="roomio-page-desc">Kaydedildi.</p> : null}
        <p className="roomio-page-desc" style={{ marginTop: 12 }}>
          Misafir URL: <Link href="/carbon">/carbon</Link> · {config.co2PerNightKg} kg CO₂/gece · {config.offsetCostPerKg} {config.currency}/kg
        </p>
      </FormSection>
    </PageHeader>
  );
}
