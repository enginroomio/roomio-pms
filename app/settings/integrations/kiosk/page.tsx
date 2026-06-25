'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { PageHeader } from '@/components/PageHeader';
import { FormActions, FormField, FormGrid, FormSection, Input } from '@/components/kit';
import { Button } from '@/components/ui';
import { roomioFetch } from '@/lib/client/api';
import { DEFAULT_KIOSK_CONFIG, type KioskConfig } from '@/lib/kiosk/types';

export default function KioskSettingsPage() {
  const [config, setConfig] = useState<KioskConfig>(DEFAULT_KIOSK_CONFIG);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    void roomioFetch('/api/kiosk/config')
      .then((r) => r.json())
      .then((j: KioskConfig) => setConfig({ ...DEFAULT_KIOSK_CONFIG, ...j }));
  }, []);

  async function save() {
    await roomioFetch('/api/kiosk/config', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(config),
    });
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  return (
    <PageHeader
      breadcrumb="Ayarlar > Check-in Kiosk"
      title="Check-in Kiosk"
      description="Lobi self check-in terminali — kimlik tarama ve oda kartı yazdırma."
      actions={<Button variant="secondary" href="/settings/integrations">← Entegrasyonlar</Button>}
    >
      <FormSection title="Terminal">
        <FormGrid>
          <label className="roomio-field roomio-field--row">
            <input type="checkbox" checked={config.enabled} onChange={(e) => setConfig({ ...config, enabled: e.target.checked })} />
            <span>Kiosk aktif</span>
          </label>
          <FormField label="Otel adı"><Input value={config.hotelName} onChange={(e) => setConfig({ ...config, hotelName: e.target.value })} /></FormField>
          <label className="roomio-field roomio-field--row">
            <input type="checkbox" checked={config.allowIdScan} onChange={(e) => setConfig({ ...config, allowIdScan: e.target.checked })} />
            <span>Kimlik tarama</span>
          </label>
          <label className="roomio-field roomio-field--row">
            <input type="checkbox" checked={config.printRoomKey} onChange={(e) => setConfig({ ...config, printRoomKey: e.target.checked })} />
            <span>Oda kartı yazdır</span>
          </label>
          <label className="roomio-field roomio-field--row">
            <input type="checkbox" checked={config.allowPayment} onChange={(e) => setConfig({ ...config, allowPayment: e.target.checked })} />
            <span>Ödeme al</span>
          </label>
        </FormGrid>
        <FormActions className="roomio-form-actions--spaced">
          <Button onClick={() => void save()}>Kaydet</Button>
          <Button variant="secondary" href="/kiosk" target="_blank">Canlı önizleme</Button>
        </FormActions>
        {saved ? <p className="roomio-page-desc">Kaydedildi.</p> : null}
        <p className="roomio-page-desc" style={{ marginTop: 12 }}>
          Kiosk URL: <Link href="/kiosk">/kiosk</Link> · Diller: {config.languages.join(', ')}
        </p>
      </FormSection>
    </PageHeader>
  );
}
