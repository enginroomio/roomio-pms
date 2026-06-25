'use client';

import { useEffect, useState } from 'react';
import { PageHeader } from '@/components/PageHeader';
import { FormActions, FormField, FormGrid, FormSection, Input } from '@/components/kit';
import { Button } from '@/components/ui';
import { roomioFetch } from '@/lib/client/api';
import { DEFAULT_CALL_CENTER_CONFIG, type CallCenterConfig } from '@/lib/integrations/call-center/types';

export default function CallCenterSettingsPage() {
  const [config, setConfig] = useState<CallCenterConfig>(DEFAULT_CALL_CENTER_CONFIG);
  const [saved, setSaved] = useState(false);
  const [testMsg, setTestMsg] = useState<string | null>(null);

  useEffect(() => {
    void roomioFetch('/api/integrations/call-center/config')
      .then((r) => r.json())
      .then((j: CallCenterConfig) => setConfig({ ...DEFAULT_CALL_CENTER_CONFIG, ...j }));
  }, []);

  async function save() {
    await roomioFetch('/api/integrations/call-center/config', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(config),
    });
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  async function test() {
    const res = await roomioFetch('/api/integrations/call-center/config?test=1', { method: 'POST' });
    const j = (await res.json()) as { message?: string };
    setTestMsg(j.message ?? 'Test tamamlandı');
  }

  return (
    <PageHeader
      breadcrumb="Ayarlar > Çağrı Merkezi"
      title="Çağrı Merkezi"
      description="Rezervasyon kuyruğu, PBX entegrasyonu ve upsell senaryoları."
      actions={<Button variant="secondary" href="/settings/integrations">← Entegrasyonlar</Button>}
    >
      <FormSection title="Kuyruk">
        <FormGrid>
          <label className="roomio-field roomio-field--row">
            <input type="checkbox" checked={config.enabled} onChange={(e) => setConfig({ ...config, enabled: e.target.checked })} />
            <span>Çağrı merkezi aktif</span>
          </label>
          <FormField label="Kuyruk adı"><Input value={config.queueName} onChange={(e) => setConfig({ ...config, queueName: e.target.value })} /></FormField>
          <FormField label="Max bekleme (sn)"><Input type="number" value={config.maxWaitSeconds} onChange={(e) => setConfig({ ...config, maxWaitSeconds: Number(e.target.value) })} /></FormField>
          <label className="roomio-field roomio-field--row">
            <input type="checkbox" checked={config.linkToPbx} onChange={(e) => setConfig({ ...config, linkToPbx: e.target.checked })} />
            <span>PBX ile bağla</span>
          </label>
          <label className="roomio-field roomio-field--row">
            <input type="checkbox" checked={config.recordCalls} onChange={(e) => setConfig({ ...config, recordCalls: e.target.checked })} />
            <span>Çağrı kaydı</span>
          </label>
        </FormGrid>
        <FormActions className="roomio-form-actions--spaced">
          <Button onClick={() => void save()}>Kaydet</Button>
          <Button variant="secondary" onClick={() => void test()}>PBX testi</Button>
        </FormActions>
        {saved ? <p className="roomio-page-desc">Kaydedildi.</p> : null}
        {testMsg ? <p className="roomio-page-desc">{testMsg}</p> : null}
      </FormSection>
      <FormSection title="Upsell senaryoları" className="roomio-form-section--spaced">
        <ul className="roomio-page-desc">
          {config.upsellScripts.map((s, i) => <li key={i}>{s}</li>)}
        </ul>
      </FormSection>
    </PageHeader>
  );
}
