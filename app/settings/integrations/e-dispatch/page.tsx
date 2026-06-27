'use client';

import { useEffect, useState } from 'react';
import { IntegrationPageLayout } from '@/components/sistem/IntegrationPageLayout';
import { FormActions, FormField, FormGrid, FormSection, Input } from '@/components/kit';
import { Button } from '@/components/ui';
import { roomioFetch } from '@/lib/client/api';
import {
  DEFAULT_EDISPATCH_CONFIG,
  type EdispatchConfig,
  type EdispatchSendResult,
} from '@/lib/integrations/e-dispatch/types';

export default function EdispatchSettingsPage() {
  const [config, setConfig] = useState<EdispatchConfig>(DEFAULT_EDISPATCH_CONFIG);
  const [saved, setSaved] = useState(false);
  const [testResult, setTestResult] = useState<EdispatchSendResult | null>(null);

  useEffect(() => {
    void roomioFetch('/api/integrations/e-dispatch/config')
      .then((r) => r.json())
      .then((j: EdispatchConfig) => setConfig({ ...DEFAULT_EDISPATCH_CONFIG, ...j }));
  }, []);

  async function save() {
    await roomioFetch('/api/integrations/e-dispatch/config', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(config),
    });
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  async function test() {
    const res = await roomioFetch('/api/integrations/e-dispatch/config?test=1', { method: 'POST' });
    setTestResult((await res.json()) as EdispatchSendResult);
  }

  return (
    <IntegrationPageLayout
      segment={"e-İrsaliye"}
      title={"e-İrsaliye"}
      description={"GİB uyumlu sevk irsaliyesi — test ve canlı ortam."}
      >
      <FormSection title="Bağlantı">
        <FormGrid>
          <label className="roomio-field roomio-field--row">
            <input type="checkbox" checked={config.enabled} onChange={(e) => setConfig({ ...config, enabled: e.target.checked })} />
            <span>Entegrasyon aktif</span>
          </label>
          <FormField label="Ortam">
            <select className="roomio-input" value={config.environment} onChange={(e) => setConfig({ ...config, environment: e.target.value as EdispatchConfig['environment'] })}>
              <option value="test">Test</option>
              <option value="production">Production</option>
            </select>
          </FormField>
          <FormField label="Entegratör"><Input value={config.integrator} onChange={(e) => setConfig({ ...config, integrator: e.target.value })} /></FormField>
          <FormField label="Kullanıcı"><Input value={config.username} onChange={(e) => setConfig({ ...config, username: e.target.value })} /></FormField>
          <FormField label="Şifre"><Input type="password" value={config.password} onChange={(e) => setConfig({ ...config, password: e.target.value })} /></FormField>
          <FormField label="VKN"><Input value={config.vkn} onChange={(e) => setConfig({ ...config, vkn: e.target.value })} /></FormField>
          <label className="roomio-field roomio-field--row">
            <input type="checkbox" checked={config.autoSendOnShipment} onChange={(e) => setConfig({ ...config, autoSendOnShipment: e.target.checked })} />
            <span>Sevkiyatta otomatik gönder</span>
          </label>
          <label className="roomio-field roomio-field--row">
            <input type="checkbox" checked={config.simulateWhenOffline} onChange={(e) => setConfig({ ...config, simulateWhenOffline: e.target.checked })} />
            <span>Çevrimdışı simülasyon</span>
          </label>
        </FormGrid>
        <FormActions className="roomio-form-actions--spaced">
          <Button onClick={() => void save()}>Kaydet</Button>
          <Button variant="secondary" onClick={() => void test()}>Bağlantı testi</Button>
        </FormActions>
        {saved ? <p className="roomio-page-desc">Kaydedildi.</p> : null}
        {testResult ? <p className="roomio-page-desc">{testResult.message}</p> : null}
      </FormSection>
    </IntegrationPageLayout>
  );
}
