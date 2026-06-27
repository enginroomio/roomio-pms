'use client';

import { useEffect, useState } from 'react';
import { IntegrationPageLayout } from '@/components/sistem/IntegrationPageLayout';
import { FormActions, FormField, FormGrid, FormSection } from '@/components/kit';
import { Button } from '@/components/ui';
import { roomioFetch } from '@/lib/client/api';

type EgmConfig = {
  enabled: boolean;
  gatewayUrl: string;
  facilityCode: string;
  autoSubmitOnCheckIn: boolean;
  simulateWhenOffline: boolean;
};

const DEFAULT_CONFIG: EgmConfig = {
  enabled: true,
  gatewayUrl: '',
  facilityCode: 'SAPPHIRE',
  autoSubmitOnCheckIn: false,
  simulateWhenOffline: true,
};

export default function EgmIntegrationPage() {
  const [config, setConfig] = useState<EgmConfig>(DEFAULT_CONFIG);
  const [saved, setSaved] = useState(false);
  const [testMsg, setTestMsg] = useState<string | null>(null);

  useEffect(() => {
    void roomioFetch('/api/integrations/egm/config')
      .then((r) => (r.ok ? r.json() : DEFAULT_CONFIG))
      .then((j: EgmConfig) => setConfig({ ...DEFAULT_CONFIG, ...j }))
      .catch(() => undefined);
  }, []);

  async function save() {
    await roomioFetch('/api/integrations/egm/config', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(config),
    });
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  async function testConnection() {
    const res = await roomioFetch('/api/integrations/egm/test');
    const j = (await res.json()) as { connection?: { ok: boolean; message: string; simulated?: boolean } };
    const c = j.connection;
    setTestMsg(c ? `${c.message}${c.simulated ? ' (simülasyon)' : ''}` : 'Test tamamlandı');
  }

  return (
    <IntegrationPageLayout
      segment="EGM / KBS Kimlik Bildirimi"
      title="EGM / KBS Kimlik Bildirimi"
      description="Konaklama kimlik bildirimi — rezervasyon ve check-in ile entegre."
      actions={<Button variant="secondary" href="/reservations?tab=egm">Rezervasyon EGM listesi</Button>}
    >
      <FormSection title="Bağlantı">
        <FormGrid>
          <label className="roomio-field roomio-field--row">
            <input type="checkbox" checked={config.enabled} onChange={(e) => setConfig({ ...config, enabled: e.target.checked })} />
            <span>EGM bildirimi aktif</span>
          </label>
          <label className="roomio-field roomio-field--row">
            <input type="checkbox" checked={config.autoSubmitOnCheckIn} onChange={(e) => setConfig({ ...config, autoSubmitOnCheckIn: e.target.checked })} />
            <span>Check-in sonrası otomatik gönder</span>
          </label>
          <label className="roomio-field roomio-field--row">
            <input type="checkbox" checked={config.simulateWhenOffline} onChange={(e) => setConfig({ ...config, simulateWhenOffline: e.target.checked })} />
            <span>Gateway yoksa simülasyon</span>
          </label>
          <FormField label="Gateway URL">
            <input className="roomio-input" value={config.gatewayUrl} onChange={(e) => setConfig({ ...config, gatewayUrl: e.target.value })} placeholder="https://egm-gateway.example/kbs" />
          </FormField>
          <FormField label="Tesis kodu">
            <input className="roomio-input" value={config.facilityCode} onChange={(e) => setConfig({ ...config, facilityCode: e.target.value })} />
          </FormField>
        </FormGrid>
        <FormActions className="roomio-form-actions--spaced">
          <Button onClick={() => void save()}>Kaydet</Button>
          <Button variant="secondary" onClick={() => void testConnection()}>Bağlantı testi</Button>
        </FormActions>
        {saved ? <p className="roomio-page-desc">Kaydedildi.</p> : null}
        {testMsg ? <p className="roomio-page-desc">{testMsg}</p> : null}
      </FormSection>

      <FormSection title="5651 uyumluluk" className="roomio-form-section--spaced">
        <p className="roomio-page-desc">
          WiFi hotspot loglama için <a href="/settings/compliance/5651">5651 modülü</a> ayarlarını kullanın.
        </p>
      </FormSection>
    </IntegrationPageLayout>
  );
}
