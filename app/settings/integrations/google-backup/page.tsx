'use client';

import { useEffect, useState } from 'react';
import { PageHeader } from '@/components/PageHeader';
import { FormActions, FormField, FormGrid, FormSection, Input } from '@/components/kit';
import { Button } from '@/components/ui';
import { roomioFetch } from '@/lib/client/api';
import {
  DEFAULT_GOOGLE_BACKUP_CONFIG,
  type GoogleBackupConfig,
  type GoogleBackupResult,
} from '@/lib/integrations/google-backup/types';

export default function GoogleBackupSettingsPage() {
  const [config, setConfig] = useState<GoogleBackupConfig>(DEFAULT_GOOGLE_BACKUP_CONFIG);
  const [saved, setSaved] = useState(false);
  const [testResult, setTestResult] = useState<GoogleBackupResult | null>(null);
  const [backupResult, setBackupResult] = useState<GoogleBackupResult | null>(null);

  useEffect(() => {
    void roomioFetch('/api/integrations/google-backup/config')
      .then((r) => r.json())
      .then((j: GoogleBackupConfig) => setConfig({ ...DEFAULT_GOOGLE_BACKUP_CONFIG, ...j }));
  }, []);

  async function save() {
    await roomioFetch('/api/integrations/google-backup/config', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(config),
    });
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  async function test() {
    const res = await roomioFetch('/api/integrations/google-backup/config?test=1', { method: 'POST' });
    setTestResult((await res.json()) as GoogleBackupResult);
  }

  async function backup() {
    const res = await roomioFetch('/api/integrations/google-backup/backup', { method: 'POST' });
    setBackupResult((await res.json()) as GoogleBackupResult);
  }

  return (
    <PageHeader
      breadcrumb="Ayarlar > Google BigQuery Yedekleme"
      title="Google BigQuery Yedekleme"
      description="Otel verilerinin BigQuery'ye periyodik yedeklenmesi."
      actions={<Button variant="secondary" href="/settings/integrations">← Entegrasyonlar</Button>}
    >
      <FormSection title="Bağlantı">
        <FormGrid>
          <label className="roomio-field roomio-field--row">
            <input type="checkbox" checked={config.enabled} onChange={(e) => setConfig({ ...config, enabled: e.target.checked })} />
            <span>Entegrasyon aktif</span>
          </label>
          <FormField label="GCP Project ID"><Input value={config.projectId} onChange={(e) => setConfig({ ...config, projectId: e.target.value })} /></FormField>
          <FormField label="Dataset ID"><Input value={config.datasetId} onChange={(e) => setConfig({ ...config, datasetId: e.target.value })} /></FormField>
          <FormField label="Service Account"><Input value={config.serviceAccountEmail} onChange={(e) => setConfig({ ...config, serviceAccountEmail: e.target.value })} /></FormField>
          <FormField label="Yedekleme aralığı (saat)"><Input type="number" value={config.backupIntervalHours} onChange={(e) => setConfig({ ...config, backupIntervalHours: Number(e.target.value) })} /></FormField>
          <FormField label="Saklama süresi (gün)"><Input type="number" value={config.retainDays} onChange={(e) => setConfig({ ...config, retainDays: Number(e.target.value) })} /></FormField>
          <FormField label="Tablolar (virgülle)">
            <Input
              value={config.tables.join(', ')}
              onChange={(e) => setConfig({ ...config, tables: e.target.value.split(',').map((t) => t.trim()).filter(Boolean) })}
            />
          </FormField>
          <label className="roomio-field roomio-field--row">
            <input type="checkbox" checked={config.simulateWhenOffline} onChange={(e) => setConfig({ ...config, simulateWhenOffline: e.target.checked })} />
            <span>Çevrimdışı simülasyon</span>
          </label>
        </FormGrid>
        <FormActions className="roomio-form-actions--spaced">
          <Button onClick={() => void save()}>Kaydet</Button>
          <Button variant="secondary" onClick={() => void backup()}>Yedekle</Button>
          <Button variant="secondary" onClick={() => void test()}>Bağlantı testi</Button>
        </FormActions>
        {saved ? <p className="roomio-page-desc">Kaydedildi.</p> : null}
        {backupResult ? <p className="roomio-page-desc">{backupResult.message}{backupResult.rowsExported ? ` (${backupResult.rowsExported} satır)` : ''}</p> : null}
        {testResult ? <p className="roomio-page-desc">{testResult.message}</p> : null}
      </FormSection>
    </PageHeader>
  );
}
