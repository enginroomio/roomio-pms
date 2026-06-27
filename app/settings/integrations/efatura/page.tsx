'use client';

import { useEffect, useState } from 'react';
import { IntegrationPageLayout } from '@/components/sistem/IntegrationPageLayout';
import { FormActions, FormField, FormGrid, FormSection, Input } from '@/components/kit';
import { Button } from '@/components/ui';
import { roomioFetch } from '@/lib/client/api';
import {
  DEFAULT_EFATURA_CONFIG,
  type EfaturaConfig,
  type EfaturaSendResult,
  type EfaturaSubmission,
} from '@/lib/integrations/efatura/types';

export default function EfaturaSettingsPage() {
  const [config, setConfig] = useState<EfaturaConfig>(DEFAULT_EFATURA_CONFIG);
  const [saved, setSaved] = useState(false);
  const [testResult, setTestResult] = useState<EfaturaSendResult | null>(null);
  const [submissions, setSubmissions] = useState<EfaturaSubmission[]>([]);

  useEffect(() => {
    void Promise.all([
      roomioFetch('/api/integrations/efatura/config').then((r) => r.json()),
      roomioFetch('/api/integrations/efatura/config?submissions=1').then((r) => r.json()),
    ]).then(([cfg, sub]) => {
      setConfig({ ...DEFAULT_EFATURA_CONFIG, ...cfg });
      setSubmissions((sub as { submissions?: EfaturaSubmission[] }).submissions ?? []);
    });
  }, []);

  async function save() {
    await roomioFetch('/api/integrations/efatura/config', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(config),
    });
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  async function test() {
    const res = await roomioFetch('/api/integrations/efatura/config?test=1', { method: 'POST' });
    setTestResult((await res.json()) as EfaturaSendResult);
  }

  return (
    <IntegrationPageLayout
      segment={"e-Fatura / e-Arşiv"}
      title={"e-Fatura / e-Arşiv"}
      description={"GİB uyumlu fatura gönderimi — test ve canlı ortam."}
      >
      <FormSection title="Bağlantı">
        <FormGrid>
          <label className="roomio-field roomio-field--row">
            <input type="checkbox" checked={config.enabled} onChange={(e) => setConfig({ ...config, enabled: e.target.checked })} />
            <span>Entegrasyon aktif</span>
          </label>
          <FormField label="Ortam">
            <select className="roomio-input" value={config.environment} onChange={(e) => setConfig({ ...config, environment: e.target.value as EfaturaConfig['environment'] })}>
              <option value="test">Test</option>
              <option value="production">Production</option>
            </select>
          </FormField>
          <FormField label="Entegratör"><Input value={config.integrator} onChange={(e) => setConfig({ ...config, integrator: e.target.value })} /></FormField>
          <FormField label="Kullanıcı"><Input value={config.username} onChange={(e) => setConfig({ ...config, username: e.target.value })} /></FormField>
          <FormField label="Şifre"><Input type="password" value={config.password} onChange={(e) => setConfig({ ...config, password: e.target.value })} /></FormField>
          <FormField label="VKN"><Input value={config.vkn} onChange={(e) => setConfig({ ...config, vkn: e.target.value })} /></FormField>
          <FormField label="e-Fatura alias"><Input value={config.alias} onChange={(e) => setConfig({ ...config, alias: e.target.value })} /></FormField>
          <label className="roomio-field roomio-field--row">
            <input type="checkbox" checked={config.autoSendOnIssue} onChange={(e) => setConfig({ ...config, autoSendOnIssue: e.target.checked })} />
            <span>Fatura kesilince otomatik gönder</span>
          </label>
          <label className="roomio-field roomio-field--row">
            <input type="checkbox" checked={config.sendEArchive} onChange={(e) => setConfig({ ...config, sendEArchive: e.target.checked })} />
            <span>e-Arşiv</span>
          </label>
        </FormGrid>
        <FormActions className="roomio-form-actions--spaced">
          <Button onClick={() => void save()}>Kaydet</Button>
          <Button variant="secondary" onClick={() => void test()}>Bağlantı Testi</Button>
        </FormActions>
        {saved ? <p className="roomio-page-desc">Kaydedildi.</p> : null}
        {testResult ? <p className="roomio-page-desc">{testResult.message}</p> : null}
      </FormSection>

      <FormSection title="Son Gönderimler" className="roomio-form-section--spaced">
        <div className="roomio-table-wrap">
          <table className="roomio-table">
            <thead><tr><th>Fatura</th><th>Durum</th><th>Tarih</th><th>Mesaj</th></tr></thead>
            <tbody>
              {submissions.length ? submissions.slice(0, 10).map((s) => (
                <tr key={s.id}>
                  <td>{s.invoiceNo}</td>
                  <td>{s.status}{s.simulated ? ' (sim)' : ''}</td>
                  <td>{s.submittedAt.slice(0, 19).replace('T', ' ')}</td>
                  <td>{s.message}</td>
                </tr>
              )) : (
                <tr><td colSpan={4}>Henüz gönderim yok — Muhasebe › Fatura listesinden gönderebilirsiniz.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </FormSection>
    </IntegrationPageLayout>
  );
}
