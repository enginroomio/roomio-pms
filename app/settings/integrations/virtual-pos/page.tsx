'use client';

import { useEffect, useState } from 'react';
import { PageHeader } from '@/components/PageHeader';
import { FormActions, FormField, FormGrid, FormSection, Input } from '@/components/kit';
import { Button } from '@/components/ui';
import { roomioFetch } from '@/lib/client/api';
import { DEFAULT_VIRTUAL_POS_CONFIG, type VirtualPosChargeResult, type VirtualPosConfig } from '@/lib/integrations/virtual-pos/types';

export default function VirtualPosSettingsPage() {
  const [config, setConfig] = useState<VirtualPosConfig>(DEFAULT_VIRTUAL_POS_CONFIG);
  const [saved, setSaved] = useState(false);
  const [testResult, setTestResult] = useState<VirtualPosChargeResult | null>(null);
  const [chargeResult, setChargeResult] = useState<VirtualPosChargeResult | null>(null);

  useEffect(() => {
    void roomioFetch('/api/integrations/virtual-pos/config')
      .then((r) => r.json())
      .then((j: VirtualPosConfig) => setConfig({ ...DEFAULT_VIRTUAL_POS_CONFIG, ...j }));
  }, []);

  async function save() {
    await roomioFetch('/api/integrations/virtual-pos/config', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(config),
    });
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  async function test() {
    const res = await roomioFetch('/api/integrations/virtual-pos/config?test=1', { method: 'POST' });
    setTestResult((await res.json()) as VirtualPosChargeResult);
  }

  async function demoCharge() {
    if (!config.enabled) {
      setChargeResult({ ok: false, message: 'Önce entegrasyonu aktifleştirin ve kaydedin' });
      return;
    }
    const res = await roomioFetch('/api/integrations/virtual-pos/charge', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ amount: 1, currency: 'TRY', refNo: `demo-${Date.now()}`, cardHolder: 'Demo' }),
    });
    setChargeResult((await res.json()) as VirtualPosChargeResult);
  }

  return (
    <PageHeader
      breadcrumb="Ayarlar > Sanal POS"
      title="Sanal POS"
      description="Online ödeme tahsilatı — iyzico, PayTR ve diğer sanal POS sağlayıcıları."
      actions={<Button variant="secondary" href="/settings/integrations">← Entegrasyonlar</Button>}
    >
      <FormSection title="Bağlantı">
        <FormGrid>
          <label className="roomio-field roomio-field--row">
            <input type="checkbox" checked={config.enabled} onChange={(e) => setConfig({ ...config, enabled: e.target.checked })} />
            <span>Entegrasyon aktif</span>
          </label>
          <FormField label="Sağlayıcı"><Input value={config.provider} onChange={(e) => setConfig({ ...config, provider: e.target.value })} /></FormField>
          <FormField label="Merchant ID"><Input value={config.merchantId} onChange={(e) => setConfig({ ...config, merchantId: e.target.value })} /></FormField>
          <FormField label="API Key"><Input type="password" value={config.apiKey} onChange={(e) => setConfig({ ...config, apiKey: e.target.value })} /></FormField>
          <FormField label="Secret Key"><Input type="password" value={config.secretKey} onChange={(e) => setConfig({ ...config, secretKey: e.target.value })} /></FormField>
          <label className="roomio-field roomio-field--row">
            <input type="checkbox" checked={config.threeDSecure} onChange={(e) => setConfig({ ...config, threeDSecure: e.target.checked })} />
            <span>3D Secure</span>
          </label>
          <label className="roomio-field roomio-field--row">
            <input type="checkbox" checked={config.installmentEnabled} onChange={(e) => setConfig({ ...config, installmentEnabled: e.target.checked })} />
            <span>Taksit</span>
          </label>
          <label className="roomio-field roomio-field--row">
            <input type="checkbox" checked={config.simulateWhenOffline} onChange={(e) => setConfig({ ...config, simulateWhenOffline: e.target.checked })} />
            <span>Çevrimdışı simülasyon</span>
          </label>
        </FormGrid>
        <FormActions className="roomio-form-actions--spaced">
          <Button onClick={() => void save()}>Kaydet</Button>
          <Button variant="secondary" onClick={() => void test()}>Bağlantı testi</Button>
          <Button variant="secondary" onClick={() => void demoCharge()}>Demo tahsilat</Button>
        </FormActions>
        {saved ? <p className="roomio-page-desc">Kaydedildi.</p> : null}
        {testResult ? <p className="roomio-page-desc">{testResult.message}</p> : null}
        {chargeResult ? <p className="roomio-page-desc">{chargeResult.message}</p> : null}
      </FormSection>
    </PageHeader>
  );
}
