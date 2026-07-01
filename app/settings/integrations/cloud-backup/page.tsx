'use client';

import { useEffect, useState } from 'react';
import { IntegrationPageLayout } from '@/components/sistem/IntegrationPageLayout';
import { FormActions, FormField, FormGrid, FormSection, Input } from '@/components/kit';
import { Button } from '@/components/ui';
import { roomioFetch } from '@/lib/client/api';
import {
  DEFAULT_CLOUD_BACKUP_CONFIG,
  type CloudBackupConfig,
  type CloudBackupHistoryItem,
  type CloudBackupProviderId,
  type CloudBackupResult,
} from '@/lib/integrations/cloud-backup/types';

const PROVIDERS: { id: CloudBackupProviderId; label: string }[] = [
  { id: 'local', label: 'Yerel / Harici disk (USB)' },
  { id: 'google-drive', label: 'Google Drive' },
  { id: 's3', label: 'S3 / R2 / MinIO' },
  { id: 'webhook', label: 'Webhook (herhangi bir bulut)' },
];

type MountedVolume = { name: string; path: string; suggestedBackupPath: string };

export default function CloudBackupSettingsPage() {
  const [config, setConfig] = useState<CloudBackupConfig>(DEFAULT_CLOUD_BACKUP_CONFIG);
  const [history, setHistory] = useState<CloudBackupHistoryItem[]>([]);
  const [volumes, setVolumes] = useState<MountedVolume[]>([]);
  const [saved, setSaved] = useState(false);
  const [testResult, setTestResult] = useState<CloudBackupResult | null>(null);
  const [backupResult, setBackupResult] = useState<CloudBackupResult | null>(null);

  function reloadHistory() {
    void roomioFetch('/api/cloud-backup/history?limit=10')
      .then((r) => r.json())
      .then((j: { runs?: CloudBackupHistoryItem[] }) => setHistory(j.runs ?? []));
  }

  useEffect(() => {
    void roomioFetch('/api/cloud-backup/config')
      .then((r) => r.json())
      .then((j: CloudBackupConfig) =>
        setConfig({
          ...DEFAULT_CLOUD_BACKUP_CONFIG,
          ...j,
          local: { ...DEFAULT_CLOUD_BACKUP_CONFIG.local, ...j.local },
          googleDrive: { ...DEFAULT_CLOUD_BACKUP_CONFIG.googleDrive, ...j.googleDrive },
          s3: { ...DEFAULT_CLOUD_BACKUP_CONFIG.s3, ...j.s3 },
          webhook: { ...DEFAULT_CLOUD_BACKUP_CONFIG.webhook, ...j.webhook },
        }),
      );
    void roomioFetch('/api/cloud-backup/volumes')
      .then((r) => r.json())
      .then((j: { volumes?: MountedVolume[] }) => setVolumes(j.volumes ?? []));
    reloadHistory();
  }, []);

  async function save() {
    await roomioFetch('/api/cloud-backup/config', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(config),
    });
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  async function test() {
    const res = await roomioFetch('/api/cloud-backup/config?test=1', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...config, enabled: true }),
    });
    setTestResult((await res.json()) as CloudBackupResult);
  }

  async function backup() {
    const res = await roomioFetch('/api/cloud-backup/run', { method: 'POST' });
    setBackupResult((await res.json()) as CloudBackupResult);
    reloadHistory();
  }

  async function pruneRemote() {
    const res = await roomioFetch('/api/cloud-backup/prune', { method: 'POST' });
    const j = (await res.json()) as { removed?: number; message?: string };
    setBackupResult({ ok: true, message: j.message ?? `${j.removed ?? 0} uzak yedek temizlendi` });
    reloadHistory();
  }

  return (
    <IntegrationPageLayout
      segment="Bulut Yedekleme"
      title="Veritabanı & Gün Sonu Yedekleme"
      description="SQLite veritabanı ve GR gün sonu arşivini harici diske (SanDisk/USB), Google Drive, S3 veya webhook ile yedekleyin."
    >
      <FormSection title="Genel">
        <FormGrid>
          <FormField label="Etkin">
            <label className="roomio-checkbox-row">
              <input type="checkbox" checked={config.enabled} onChange={(e) => setConfig({ ...config, enabled: e.target.checked })} />
              Bulut yedekleme açık
            </label>
          </FormField>
          <FormField label="Sağlayıcı">
            <select className="roomio-select" value={config.provider} onChange={(e) => setConfig({ ...config, provider: e.target.value as CloudBackupProviderId })}>
              {PROVIDERS.map((p) => (<option key={p.id} value={p.id}>{p.label}</option>))}
            </select>
          </FormField>
          <FormField label="Yedekleme aralığı (saat)"><Input type="number" value={config.backupIntervalHours} onChange={(e) => setConfig({ ...config, backupIntervalHours: Number(e.target.value) })} /></FormField>
          <FormField label="Yerel saklama (gün)"><Input type="number" value={config.retainLocalDays} onChange={(e) => setConfig({ ...config, retainLocalDays: Number(e.target.value) })} /></FormField>
          <FormField label="Uzak saklama (gün)"><Input type="number" value={config.retainRemoteDays} onChange={(e) => setConfig({ ...config, retainRemoteDays: Number(e.target.value) })} /></FormField>
          <FormField label="İçerik">
            <label className="roomio-checkbox-row"><input type="checkbox" checked={config.includeDatabase} onChange={(e) => setConfig({ ...config, includeDatabase: e.target.checked })} /> Veritabanı</label>
            <label className="roomio-checkbox-row"><input type="checkbox" checked={config.includeEodSnapshots} onChange={(e) => setConfig({ ...config, includeEodSnapshots: e.target.checked })} /> Gün sonu GR arşivi</label>
            <label className="roomio-checkbox-row"><input type="checkbox" checked={config.backupOnEodClose} onChange={(e) => setConfig({ ...config, backupOnEodClose: e.target.checked })} /> Gün kapanışında otomatik yedek</label>
            <label className="roomio-checkbox-row"><input type="checkbox" checked={config.backupAfterDailyArchive} onChange={(e) => setConfig({ ...config, backupAfterDailyArchive: e.target.checked })} /> Günlük GR arşivi sonrası yedek</label>
          </FormField>
        </FormGrid>
      </FormSection>

      {config.provider === 'local' ? (
        <FormSection title="Harici disk (Mac / USB)">
          <p className="roomio-page-desc">
            SanDisk veya başka bir USB diske yedeklemek için yol girin. Mac&apos;te genelde{' '}
            <code>/Volumes/DiskAdi/roomio-backups</code> formatındadır. Disk NTFS ise Mac&apos;te salt okunur olabilir — exFAT veya APFS önerilir.
          </p>
          <FormGrid>
            <FormField label="Harici yedek klasörü">
              <Input
                value={config.local.externalPath}
                placeholder="/Volumes/SanDisk/roomio-backups"
                onChange={(e) => setConfig({ ...config, local: { ...config.local, externalPath: e.target.value } })}
              />
            </FormField>
          </FormGrid>
          {volumes.length > 0 ? (
            <div className="roomio-form-actions" style={{ marginTop: 8 }}>
              {volumes.map((v) => (
                <Button
                  key={v.path}
                  variant="secondary"
                  type="button"
                  onClick={() => setConfig({ ...config, local: { ...config.local, externalPath: v.suggestedBackupPath } })}
                >
                  {v.name} kullan
                </Button>
              ))}
            </div>
          ) : (
            <p className="roomio-page-desc" style={{ marginTop: 8 }}>
              Takılı harici disk bulunamadı. USB diski takıp sayfayı yenileyin.
            </p>
          )}
        </FormSection>
      ) : null}

      {config.provider === 'google-drive' ? (
        <FormSection title="Google Drive">
          <FormGrid>
            <FormField label="Klasör ID"><Input value={config.googleDrive.folderId} onChange={(e) => setConfig({ ...config, googleDrive: { ...config.googleDrive, folderId: e.target.value } })} /></FormField>
            <FormField label="Servis hesabı"><Input value={config.googleDrive.serviceAccountEmail} onChange={(e) => setConfig({ ...config, googleDrive: { ...config.googleDrive, serviceAccountEmail: e.target.value } })} /></FormField>
          </FormGrid>
        </FormSection>
      ) : null}

      {config.provider === 's3' ? (
        <FormSection title="S3">
          <FormGrid>
            <FormField label="Endpoint"><Input value={config.s3.endpoint} onChange={(e) => setConfig({ ...config, s3: { ...config.s3, endpoint: e.target.value } })} /></FormField>
            <FormField label="Bucket"><Input value={config.s3.bucket} onChange={(e) => setConfig({ ...config, s3: { ...config.s3, bucket: e.target.value } })} /></FormField>
            <FormField label="Region"><Input value={config.s3.region} onChange={(e) => setConfig({ ...config, s3: { ...config.s3, region: e.target.value } })} /></FormField>
            <FormField label="Prefix"><Input value={config.s3.prefix} onChange={(e) => setConfig({ ...config, s3: { ...config.s3, prefix: e.target.value } })} /></FormField>
          </FormGrid>
        </FormSection>
      ) : null}

      <FormActions>
        <Button onClick={() => void save()}>{saved ? 'Kaydedildi' : 'Kaydet'}</Button>
        <Button variant="secondary" onClick={() => void test()}>Bağlantı testi</Button>
        <Button variant="secondary" onClick={() => void backup()}>Şimdi yedekle</Button>
        <Button variant="secondary" onClick={() => void pruneRemote()}>Uzak temizlik</Button>
      </FormActions>

      {testResult ? <p className="roomio-page-desc">{testResult.message}</p> : null}
      {backupResult ? <p className="roomio-page-desc">{backupResult.message}{backupResult.sizeBytes ? ` · ${Math.round(backupResult.sizeBytes / 1024)} KB` : ''}</p> : null}

      {history.length > 0 ? (
        <FormSection title="Son yedekler">
          <div className="roomio-table-wrap">
            <table className="roomio-table">
              <thead><tr><th>Tarih</th><th>İş günü</th><th>Sağlayıcı</th><th>Durum</th><th>Boyut</th><th></th></tr></thead>
              <tbody>
                {history.map((h) => (
                  <tr key={h.id}>
                    <td>{h.startedAt}</td>
                    <td>{h.businessDate ?? '—'}</td>
                    <td>{h.provider}</td>
                    <td>{h.status}</td>
                    <td>{h.sizeBytes ? `${Math.round(h.sizeBytes / 1024)} KB` : '—'}</td>
                    <td>
                      {h.status === 'ok' && h.localPath ? (
                        <a className="roomio-link" href={`/api/cloud-backup/download?runId=${encodeURIComponent(h.id)}`}>İndir</a>
                      ) : null}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </FormSection>
      ) : null}
    </IntegrationPageLayout>
  );
}
