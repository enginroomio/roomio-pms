'use client';

import { useEffect, useState } from 'react';
import { PageHeader } from '@/components/PageHeader';
import { FormActions, FormField, FormGrid, FormSection, Input, Textarea } from '@/components/kit';
import { Button } from '@/components/ui';
import { DEFAULT_TESA_CONFIG, TESA_DEFAULTS, type TesaConfig } from '@/lib/integrations/tesa/types';

export default function TesaIntegrationPage() {
  const [config, setConfig] = useState<TesaConfig>(DEFAULT_TESA_CONFIG);
  const [conn, setConn] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    void fetch('/api/integrations/tesa/config')
      .then((r) => r.json())
      .then((j: TesaConfig) => setConfig({ ...DEFAULT_TESA_CONFIG, ...j }));
  }, []);

  async function save() {
    await fetch('/api/integrations/tesa/config', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(config),
    });
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  async function test() {
    const res = await fetch('/api/integrations/tesa/encode');
    const j = (await res.json()) as { connection: { ok: boolean; message: string; simulated?: boolean } };
    setConn(j.connection.message + (j.connection.simulated ? ' (simülasyon)' : ''));
  }

  return (
    <PageHeader
      breadcrumb="Ayarlar > TESA Hospitality"
      title="TESA Hospitality 7.04.03"
      description="HT24 Industry Standard Protocol — PMS Service TCP (varsayılan port 7779)."
      actions={<Button variant="secondary" href="/settings/integrations">← Entegrasyonlar</Button>}
    >
      <FormSection title="Bağlantı">
        <FormGrid>
          <label className="roomio-field roomio-field--row">
            <input type="checkbox" checked={config.enabled} onChange={(e) => setConfig({ ...config, enabled: e.target.checked })} />
            <span>Entegrasyon aktif</span>
          </label>
          <FormField label="PMS Service host">
            <Input value={config.host} onChange={(e) => setConfig({ ...config, host: e.target.value })} />
          </FormField>
          <FormField label={`PMS Port (TESA varsayılan ${TESA_DEFAULTS.port})`}>
            <Input type="number" value={config.port} onChange={(e) => setConfig({ ...config, port: Number(e.target.value) })} />
          </FormField>
          <FormField label="Encoder PC ID (INHOVA Devices)">
            <Input value={config.encoderPcId} onChange={(e) => setConfig({ ...config, encoderPcId: e.target.value })} />
          </FormField>
          <FormField label="Encoder no">
            <Input type="number" value={config.encoderNumber} onChange={(e) => setConfig({ ...config, encoderNumber: Number(e.target.value) })} />
          </FormField>
          <label className="roomio-field roomio-field--row">
            <input type="checkbox" checked={config.simulateWhenOffline} onChange={(e) => setConfig({ ...config, simulateWhenOffline: e.target.checked })} />
            <span>TESA yoksa simülasyon (geliştirme)</span>
          </label>
        </FormGrid>
        <p className="roomio-page-desc" style={{ marginTop: 12 }}>
          TESA Hotel → Setup → PMS Service: Protocol TCP, Port {config.port}. Encoder bu PC&apos;de &quot;Local&quot; olmalı.
        </p>
        <FormActions className="roomio-form-actions--spaced">
          <Button onClick={() => void save()}>Kaydet</Button>
          <Button variant="secondary" onClick={() => void test()}>Bağlantı Testi</Button>
        </FormActions>
        {saved ? <p className="roomio-page-desc">Kaydedildi.</p> : null}
        {conn ? <p className="roomio-page-desc">{conn}</p> : null}
      </FormSection>

      <FormSection title="Oda Eşleme (Roomio → TESA kilit ID)" className="roomio-form roomio-form-section--spaced">
        <p className="roomio-page-desc">Oda numaraları birebir değilse eşleyin (ör. Roomio 312 → TESA 0312).</p>
        <Textarea
          rows={6}
          style={{ width: '100%', fontFamily: 'monospace' }}
          value={JSON.stringify(config.roomMappings, null, 2)}
          onChange={(e) => {
            try {
              setConfig({ ...config, roomMappings: JSON.parse(e.target.value) as Record<string, string> });
            } catch { /* ignore while typing */ }
          }}
        />
      </FormSection>
    </PageHeader>
  );
}
