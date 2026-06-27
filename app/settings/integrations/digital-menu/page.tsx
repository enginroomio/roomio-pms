'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { IntegrationPageLayout } from '@/components/sistem/IntegrationPageLayout';
import { FormActions, FormField, FormGrid, FormSection, Input } from '@/components/kit';
import { Button } from '@/components/ui';
import { roomioFetch } from '@/lib/client/api';
import { DEFAULT_DIGITAL_MENU_CONFIG, type DigitalMenuConfig } from '@/lib/integrations/digital-menu/types';

export default function DigitalMenuSettingsPage() {
  const [config, setConfig] = useState<DigitalMenuConfig>(DEFAULT_DIGITAL_MENU_CONFIG);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    void roomioFetch('/api/integrations/digital-menu/config')
      .then((r) => r.json())
      .then((j: DigitalMenuConfig) => setConfig({ ...DEFAULT_DIGITAL_MENU_CONFIG, ...j }));
  }, []);

  async function save() {
    await roomioFetch('/api/integrations/digital-menu/config', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(config),
    });
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  return (
    <IntegrationPageLayout
      segment={"Akıllı Dijital Menü"}
      title={"Akıllı Dijital Menü"}
      description={"QR masa menüsü, alerjen bilgisi ve mutfak sipariş entegrasyonu."}
      >
      <FormSection title="Genel">
        <FormGrid>
          <label className="roomio-field roomio-field--row">
            <input type="checkbox" checked={config.enabled} onChange={(e) => setConfig({ ...config, enabled: e.target.checked })} />
            <span>Menü aktif</span>
          </label>
          <FormField label="Otel adı"><Input value={config.hotelName} onChange={(e) => setConfig({ ...config, hotelName: e.target.value })} /></FormField>
          <label className="roomio-field roomio-field--row">
            <input type="checkbox" checked={config.qrTableOrdering} onChange={(e) => setConfig({ ...config, qrTableOrdering: e.target.checked })} />
            <span>QR masa siparişi</span>
          </label>
          <label className="roomio-field roomio-field--row">
            <input type="checkbox" checked={config.sendToKitchen} onChange={(e) => setConfig({ ...config, sendToKitchen: e.target.checked })} />
            <span>Mutfak entegrasyonu</span>
          </label>
        </FormGrid>
        <FormActions className="roomio-form-actions--spaced">
          <Button onClick={() => void save()}>Kaydet</Button>
          <Button variant="secondary" href="/menu" target="_blank">Canlı önizleme</Button>
        </FormActions>
        {saved ? <p className="roomio-page-desc">Kaydedildi.</p> : null}
        <p className="roomio-page-desc" style={{ marginTop: 12 }}>
          Misafir URL: <Link href="/menu">/menu</Link> · {config.items.filter((i) => i.available).length} aktif ürün
        </p>
      </FormSection>
    </IntegrationPageLayout>
  );
}
