'use client';

import { useEffect, useState } from 'react';
import { PageHeader } from '@/components/PageHeader';
import { FormActions, FormField, FormGrid, FormSection, Input } from '@/components/kit';
import { Button } from '@/components/ui';
import { roomioFetch } from '@/lib/client/api';
import { DEFAULT_WHATSAPP_CONFIG, type WhatsappConfig, type WhatsappSendResult } from '@/lib/integrations/whatsapp/types';

export default function WhatsappSettingsPage() {
  const [config, setConfig] = useState<WhatsappConfig>(DEFAULT_WHATSAPP_CONFIG);
  const [saved, setSaved] = useState(false);
  const [testResult, setTestResult] = useState<WhatsappSendResult | null>(null);

  useEffect(() => {
    void roomioFetch('/api/integrations/whatsapp/config')
      .then((r) => r.json())
      .then((j: WhatsappConfig) => setConfig({ ...DEFAULT_WHATSAPP_CONFIG, ...j }));
  }, []);

  async function save() {
    await roomioFetch('/api/integrations/whatsapp/config', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(config),
    });
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  async function test() {
    const res = await roomioFetch('/api/integrations/whatsapp/config?test=1', { method: 'POST' });
    setTestResult((await res.json()) as WhatsappSendResult);
  }

  return (
    <PageHeader
      breadcrumb="Ayarlar > WhatsApp API"
      title="WhatsApp Business API"
      description="Rezervasyon onayı, check-in hatırlatma ve misafir iletişimi — Meta Cloud API."
      actions={<Button variant="secondary" href="/settings/integrations">← Entegrasyonlar</Button>}
    >
      <FormSection title="Bağlantı">
        <FormGrid>
          <label className="roomio-field roomio-field--row">
            <input type="checkbox" checked={config.enabled} onChange={(e) => setConfig({ ...config, enabled: e.target.checked })} />
            <span>Entegrasyon aktif</span>
          </label>
          <FormField label="Phone Number ID"><Input value={config.phoneNumberId} onChange={(e) => setConfig({ ...config, phoneNumberId: e.target.value })} /></FormField>
          <FormField label="Business Account ID"><Input value={config.businessAccountId} onChange={(e) => setConfig({ ...config, businessAccountId: e.target.value })} /></FormField>
          <FormField label="Cloud API Token"><Input type="password" value={config.cloudApiToken} onChange={(e) => setConfig({ ...config, cloudApiToken: e.target.value })} /></FormField>
          <FormField label="Hoş geldin şablonu"><Input value={config.welcomeTemplate} onChange={(e) => setConfig({ ...config, welcomeTemplate: e.target.value })} /></FormField>
          <FormField label="Check-in şablonu"><Input value={config.checkInTemplate} onChange={(e) => setConfig({ ...config, checkInTemplate: e.target.value })} /></FormField>
        </FormGrid>
        <FormActions className="roomio-form-actions--spaced">
          <Button onClick={() => void save()}>Kaydet</Button>
          <Button variant="secondary" onClick={() => void test()}>Bağlantı testi</Button>
        </FormActions>
        {saved ? <p className="roomio-page-desc">Kaydedildi.</p> : null}
        {testResult ? <p className="roomio-page-desc">{testResult.message}</p> : null}
      </FormSection>
    </PageHeader>
  );
}
