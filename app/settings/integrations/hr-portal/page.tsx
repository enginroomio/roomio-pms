'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { IntegrationPageLayout } from '@/components/sistem/IntegrationPageLayout';
import { FormActions, FormField, FormGrid, FormSection, Input } from '@/components/kit';
import { Button } from '@/components/ui';
import { roomioFetch } from '@/lib/client/api';
import { DEFAULT_HR_PORTAL_CONFIG, type HrPortalConfig } from '@/lib/integrations/hr-portal/types';

type HrPortalTestResult = { ok: boolean; message: string; simulated?: boolean };

export default function HrPortalSettingsPage() {
  const [config, setConfig] = useState<HrPortalConfig>(DEFAULT_HR_PORTAL_CONFIG);
  const [saved, setSaved] = useState(false);
  const [testResult, setTestResult] = useState<HrPortalTestResult | null>(null);

  useEffect(() => {
    void roomioFetch('/api/integrations/hr-portal/config')
      .then((r) => r.json())
      .then((j: HrPortalConfig) => setConfig({ ...DEFAULT_HR_PORTAL_CONFIG, ...j }));
  }, []);

  async function save() {
    await roomioFetch('/api/integrations/hr-portal/config', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(config),
    });
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  async function test() {
    const res = await roomioFetch('/api/integrations/hr-portal/config?test=1', { method: 'POST' });
    setTestResult((await res.json()) as HrPortalTestResult);
  }

  return (
    <IntegrationPageLayout
      segment={"Elektraweb IK Mobil"}
      title={"Elektraweb IK Mobil"}
      description={"Personel izin, vardiya değişimi, bordro görüntüleme ve eğitim — mobil IK portalı."}
      >
      <FormSection title="Portal">
        <FormGrid>
          <label className="roomio-field roomio-field--row">
            <input type="checkbox" checked={config.enabled} onChange={(e) => setConfig({ ...config, enabled: e.target.checked })} />
            <span>Entegrasyon aktif</span>
          </label>
          <FormField label="Uygulama adı"><Input value={config.appName} onChange={(e) => setConfig({ ...config, appName: e.target.value })} /></FormField>
          <label className="roomio-field roomio-field--row">
            <input type="checkbox" checked={config.allowLeaveRequests} onChange={(e) => setConfig({ ...config, allowLeaveRequests: e.target.checked })} />
            <span>İzin talepleri</span>
          </label>
          <label className="roomio-field roomio-field--row">
            <input type="checkbox" checked={config.allowShiftSwap} onChange={(e) => setConfig({ ...config, allowShiftSwap: e.target.checked })} />
            <span>Vardiya değişimi</span>
          </label>
          <label className="roomio-field roomio-field--row">
            <input type="checkbox" checked={config.allowPayrollView} onChange={(e) => setConfig({ ...config, allowPayrollView: e.target.checked })} />
            <span>Bordro görüntüleme</span>
          </label>
          <label className="roomio-field roomio-field--row">
            <input type="checkbox" checked={config.allowTraining} onChange={(e) => setConfig({ ...config, allowTraining: e.target.checked })} />
            <span>Eğitim modülü</span>
          </label>
          <label className="roomio-field roomio-field--row">
            <input type="checkbox" checked={config.pushEnabled} onChange={(e) => setConfig({ ...config, pushEnabled: e.target.checked })} />
            <span>Push bildirimleri</span>
          </label>
          <label className="roomio-field roomio-field--row">
            <input type="checkbox" checked={config.simulateWhenOffline} onChange={(e) => setConfig({ ...config, simulateWhenOffline: e.target.checked })} />
            <span>Çevrimdışı simülasyon</span>
          </label>
        </FormGrid>
        <FormActions className="roomio-form-actions--spaced">
          <Button onClick={() => void save()}>Kaydet</Button>
          <Button variant="secondary" onClick={() => void test()}>Bağlantı testi</Button>
          <Button variant="secondary" href="/hr" target="_blank">Canlı önizleme</Button>
        </FormActions>
        {saved ? <p className="roomio-page-desc">Kaydedildi.</p> : null}
        {testResult ? <p className="roomio-page-desc">{testResult.message}</p> : null}
        <p className="roomio-page-desc" style={{ marginTop: 12 }}>Personel URL: <Link href="/hr">/hr</Link></p>
      </FormSection>
    </IntegrationPageLayout>
  );
}
