'use client';

import { useEffect, useState } from 'react';
import { PageHeader } from '@/components/PageHeader';
import { FormActions, FormField, FormGrid, FormSection } from '@/components/kit';
import { Button } from '@/components/ui';
import { roomioFetch } from '@/lib/client/api';
import {
  DEFAULT_ID_READER_CONFIG,
  type IdReaderConfig,
  type IdScanResult,
} from '@/lib/integrations/id-reader/types';

const TYPE_LABELS: Record<IdReaderConfig['devices'][number]['type'], string> = {
  passport: 'Pasaport',
  id_card: 'Kimlik',
  both: 'Pasaport + Kimlik',
};

const CONNECTION_LABELS: Record<IdReaderConfig['devices'][number]['connection'], string> = {
  usb: 'USB',
  network: 'Ağ',
};

export default function IdReaderSettingsPage() {
  const [config, setConfig] = useState<IdReaderConfig>(DEFAULT_ID_READER_CONFIG);
  const [saved, setSaved] = useState(false);
  const [testResult, setTestResult] = useState<IdScanResult | null>(null);
  const [scanResult, setScanResult] = useState<IdScanResult | null>(null);

  useEffect(() => {
    void roomioFetch('/api/integrations/id-reader/config')
      .then((r) => r.json())
      .then((j: IdReaderConfig) => setConfig({ ...DEFAULT_ID_READER_CONFIG, ...j }));
  }, []);

  async function save() {
    await roomioFetch('/api/integrations/id-reader/config', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(config),
    });
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  async function test() {
    const res = await roomioFetch('/api/integrations/id-reader/config?test=1', { method: 'POST' });
    setTestResult((await res.json()) as IdScanResult);
  }

  async function scanDemo() {
    const res = await roomioFetch('/api/integrations/id-reader/scan', { method: 'POST' });
    setScanResult((await res.json()) as IdScanResult);
  }

  return (
    <PageHeader
      breadcrumb="Ayarlar > Kimlik Okuyucu"
      title="Kimlik Okuyucu"
      description="Pasaport ve kimlik kartı tarama — check-in otomatik doldurma."
      actions={<Button variant="secondary" href="/settings/integrations">← Entegrasyonlar</Button>}
    >
      <FormSection title="Cihazlar">
        <FormGrid>
          <label className="roomio-field roomio-field--row">
            <input type="checkbox" checked={config.enabled} onChange={(e) => setConfig({ ...config, enabled: e.target.checked })} />
            <span>Entegrasyon aktif</span>
          </label>
          <label className="roomio-field roomio-field--row">
            <input type="checkbox" checked={config.autoFillOnCheckIn} onChange={(e) => setConfig({ ...config, autoFillOnCheckIn: e.target.checked })} />
            <span>Check-in&apos;de otomatik doldur</span>
          </label>
          <label className="roomio-field roomio-field--row">
            <input type="checkbox" checked={config.maskIdNumbers} onChange={(e) => setConfig({ ...config, maskIdNumbers: e.target.checked })} />
            <span>Kimlik numaralarını maskele</span>
          </label>
          <label className="roomio-field roomio-field--row">
            <input type="checkbox" checked={config.simulateWhenOffline} onChange={(e) => setConfig({ ...config, simulateWhenOffline: e.target.checked })} />
            <span>Çevrimdışı simülasyon</span>
          </label>
          <label className="roomio-field roomio-field--row">
            <input type="checkbox" checked={config.requireManualApproval} onChange={(e) => setConfig({ ...config, requireManualApproval: e.target.checked })} />
            <span>Check-in öncesi personel onayı zorunlu</span>
          </label>
          <label className="roomio-field roomio-field--row">
            <input type="checkbox" checked={config.blockCheckInUntilReady} onChange={(e) => setConfig({ ...config, blockCheckInUntilReady: e.target.checked })} />
            <span>EGM alanları tamamlanmadan check-in engelle</span>
          </label>
          <label className="roomio-field roomio-field--row">
            <input type="checkbox" checked={config.autoSendEgmAfterCheckIn} onChange={(e) => setConfig({ ...config, autoSendEgmAfterCheckIn: e.target.checked })} />
            <span>Check-in sonrası EGM otomatik gönder</span>
          </label>
        </FormGrid>
        <FormActions className="roomio-form-actions--spaced">
          <Button onClick={() => void save()}>Kaydet</Button>
          <Button variant="secondary" onClick={() => void test()}>Bağlantı testi</Button>
          <Button variant="secondary" onClick={() => void scanDemo()}>Tarama demosu</Button>
        </FormActions>
        {saved ? <p className="roomio-page-desc">Kaydedildi.</p> : null}
        {testResult ? <p className="roomio-page-desc">{testResult.message}</p> : null}
        {scanResult ? (
          <p className="roomio-page-desc">
            {scanResult.message}
            {scanResult.data ? ` — ${scanResult.data.firstName} ${scanResult.data.lastName}, ${scanResult.data.nationality}, ${scanResult.data.documentNo}` : ''}
          </p>
        ) : null}
      </FormSection>

      <FormSection title="Kayıtlı Cihazlar" className="roomio-form-section--spaced">
        <div className="roomio-table-wrap">
          <table className="roomio-table">
            <thead><tr><th>Cihaz</th><th>Tür</th><th>Bağlantı</th><th>Adres</th><th>Durum</th></tr></thead>
            <tbody>
              {config.devices.map((d) => (
                <tr key={d.id}>
                  <td>{d.name}</td>
                  <td>{TYPE_LABELS[d.type]}</td>
                  <td>{CONNECTION_LABELS[d.connection]}</td>
                  <td>{d.host ?? '—'}</td>
                  <td>{d.enabled ? 'Aktif' : 'Kapalı'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </FormSection>
    </PageHeader>
  );
}
