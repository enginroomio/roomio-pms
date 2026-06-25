'use client';

import { useEffect, useState } from 'react';
import { PageHeader } from '@/components/PageHeader';
import { FormActions, FormField, FormGrid, FormSection, Input } from '@/components/kit';
import { Button } from '@/components/ui';
import { roomioFetch } from '@/lib/client/api';
import { DEFAULT_QUALITY_CONFIG, type QualityConfig } from '@/lib/integrations/quality/types';

type QualityAuditResult = { ok: boolean; message: string; findings: number };

const STATUS_LABELS: Record<QualityConfig['documents'][number]['status'], string> = {
  draft: 'Taslak',
  published: 'Yayında',
  archived: 'Arşiv',
};

export default function QualitySettingsPage() {
  const [config, setConfig] = useState<QualityConfig>(DEFAULT_QUALITY_CONFIG);
  const [saved, setSaved] = useState(false);
  const [auditResult, setAuditResult] = useState<QualityAuditResult | null>(null);

  useEffect(() => {
    void roomioFetch('/api/integrations/quality/config')
      .then((r) => r.json())
      .then((j: QualityConfig) => setConfig({ ...DEFAULT_QUALITY_CONFIG, ...j }));
  }, []);

  async function save() {
    await roomioFetch('/api/integrations/quality/config', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(config),
    });
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  async function audit() {
    const res = await roomioFetch('/api/integrations/quality/audit', { method: 'POST' });
    setAuditResult((await res.json()) as QualityAuditResult);
  }

  return (
    <PageHeader
      breadcrumb="Ayarlar > Kalite Yönetimi"
      title="Kalite Yönetimi"
      description="ISO 9001 doküman yönetimi, prosedürler ve periyodik denetim."
      actions={<Button variant="secondary" href="/settings/integrations">← Entegrasyonlar</Button>}
    >
      <FormSection title="Kalite">
        <FormGrid>
          <label className="roomio-field roomio-field--row">
            <input type="checkbox" checked={config.enabled} onChange={(e) => setConfig({ ...config, enabled: e.target.checked })} />
            <span>Entegrasyon aktif</span>
          </label>
          <label className="roomio-field roomio-field--row">
            <input type="checkbox" checked={config.iso9001Mode} onChange={(e) => setConfig({ ...config, iso9001Mode: e.target.checked })} />
            <span>ISO 9001 modu</span>
          </label>
          <FormField label="Denetim aralığı (gün)"><Input type="number" value={config.auditIntervalDays} onChange={(e) => setConfig({ ...config, auditIntervalDays: Number(e.target.value) })} /></FormField>
          <label className="roomio-field roomio-field--row">
            <input type="checkbox" checked={config.autoRemind} onChange={(e) => setConfig({ ...config, autoRemind: e.target.checked })} />
            <span>Otomatik hatırlatma</span>
          </label>
        </FormGrid>
        <div className="roomio-table-wrap" style={{ marginTop: 12 }}>
          <table className="roomio-table">
            <thead><tr><th>Doküman</th><th>Kategori</th><th>Sürüm</th><th>Durum</th></tr></thead>
            <tbody>
              {config.documents.map((d) => (
                <tr key={d.id}>
                  <td>{d.title}</td>
                  <td>{d.category}</td>
                  <td>{d.version}</td>
                  <td>{STATUS_LABELS[d.status]}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <FormActions className="roomio-form-actions--spaced">
          <Button onClick={() => void save()}>Kaydet</Button>
          <Button variant="secondary" onClick={() => void audit()}>Kalite denetimi çalıştır</Button>
        </FormActions>
        {saved ? <p className="roomio-page-desc">Kaydedildi.</p> : null}
        {auditResult ? <p className="roomio-page-desc">{auditResult.message}</p> : null}
      </FormSection>
    </PageHeader>
  );
}
