'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { IntegrationPageLayout } from '@/components/sistem/IntegrationPageLayout';
import { FormActions, FormField, FormGrid, FormSection, Input } from '@/components/kit';
import { Button } from '@/components/ui';
import { roomioFetch } from '@/lib/client/api';
import { DEFAULT_VIOFUN_CONFIG, type ViofunConfig } from '@/lib/integrations/viofun/types';

export default function ViofunSettingsPage() {
  const [config, setConfig] = useState<ViofunConfig>(DEFAULT_VIOFUN_CONFIG);
  const [saved, setSaved] = useState(false);
  const [testMsg, setTestMsg] = useState<string | null>(null);

  useEffect(() => {
    void roomioFetch('/api/integrations/viofun/config')
      .then((r) => r.json())
      .then((j: ViofunConfig) => setConfig({ ...DEFAULT_VIOFUN_CONFIG, ...j }));
  }, []);

  async function save() {
    await roomioFetch('/api/integrations/viofun/config', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(config),
    });
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  async function test() {
    const res = await roomioFetch('/api/integrations/viofun/config?test=1', { method: 'POST' });
    const j = (await res.json()) as { message?: string };
    setTestMsg(j.message ?? 'Test tamamlandı');
  }

  return (
    <IntegrationPageLayout
      segment={"Viofun Aktivite Platformu"}
      title={"Viofun Aktivite Platformu"}
      description={"Otel içi eğlence, su sporları ve aktivite rezervasyonları."}
      >
      <FormSection title="Bağlantı">
        <FormGrid>
          <label className="roomio-field roomio-field--row">
            <input type="checkbox" checked={config.enabled} onChange={(e) => setConfig({ ...config, enabled: e.target.checked })} />
            <span>Viofun aktif</span>
          </label>
          <FormField label="Otel adı"><Input value={config.hotelName} onChange={(e) => setConfig({ ...config, hotelName: e.target.value })} /></FormField>
          <FormField label="Property kodu"><Input value={config.propertyCode} onChange={(e) => setConfig({ ...config, propertyCode: e.target.value })} /></FormField>
          <FormField label="API anahtarı"><Input type="password" value={config.apiKey} onChange={(e) => setConfig({ ...config, apiKey: e.target.value })} /></FormField>
          <label className="roomio-field roomio-field--row">
            <input type="checkbox" checked={config.allowGuestBooking} onChange={(e) => setConfig({ ...config, allowGuestBooking: e.target.checked })} />
            <span>Misafir rezervasyonu</span>
          </label>
        </FormGrid>
        <FormActions className="roomio-form-actions--spaced">
          <Button onClick={() => void save()}>Kaydet</Button>
          <Button variant="secondary" onClick={() => void test()}>Bağlantı testi</Button>
          <Button variant="secondary" href="/viofun" target="_blank">Canlı önizleme</Button>
        </FormActions>
        {saved ? <p className="roomio-page-desc">Kaydedildi.</p> : null}
        {testMsg ? <p className="roomio-page-desc">{testMsg}</p> : null}
        <p className="roomio-page-desc" style={{ marginTop: 12 }}>Misafir URL: <Link href="/viofun">/viofun</Link> · {config.activities.filter((a) => a.available).length} aktivite</p>
      </FormSection>
    </IntegrationPageLayout>
  );
}
