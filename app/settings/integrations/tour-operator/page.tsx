'use client';

import { useEffect, useState } from 'react';
import { PageHeader } from '@/components/PageHeader';
import { FormActions, FormField, FormGrid, FormSection, Input } from '@/components/kit';
import { Button } from '@/components/ui';
import { roomioFetch } from '@/lib/client/api';
import { DEFAULT_TOUR_OPERATOR_CONFIG, type TourOperatorConfig } from '@/lib/integrations/tour-operator/types';

export default function TourOperatorSettingsPage() {
  const [config, setConfig] = useState<TourOperatorConfig>(DEFAULT_TOUR_OPERATOR_CONFIG);
  const [saved, setSaved] = useState(false);
  const [testMsg, setTestMsg] = useState<string | null>(null);
  const [syncMsg, setSyncMsg] = useState<string | null>(null);

  useEffect(() => {
    void roomioFetch('/api/integrations/tour-operator/config')
      .then((r) => r.json())
      .then((j: TourOperatorConfig) => setConfig({ ...DEFAULT_TOUR_OPERATOR_CONFIG, ...j }));
  }, []);

  async function save() {
    await roomioFetch('/api/integrations/tour-operator/config', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(config),
    });
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  async function test() {
    const res = await roomioFetch('/api/integrations/tour-operator/config?test=1', { method: 'POST' });
    const j = (await res.json()) as { message?: string };
    setTestMsg(j.message ?? 'Test tamamlandı');
  }

  async function sync() {
    const res = await roomioFetch('/api/integrations/tour-operator/sync', { method: 'POST' });
    const j = (await res.json()) as { message?: string };
    setSyncMsg(j.message ?? 'Senkron tamamlandı');
  }

  return (
    <PageHeader
      breadcrumb="Ayarlar > Tur Operatörü"
      title="Tur Operatörü Entegrasyonu"
      description="TUI, Anex, ETS ve diğer operatörlerden allotment ve manifest senkronu."
      actions={<Button variant="secondary" href="/settings/integrations">← Entegrasyonlar</Button>}
    >
      <FormSection title="Operatörler">
        <FormGrid>
          <label className="roomio-field roomio-field--row">
            <input type="checkbox" checked={config.enabled} onChange={(e) => setConfig({ ...config, enabled: e.target.checked })} />
            <span>Entegrasyon aktif</span>
          </label>
          <label className="roomio-field roomio-field--row">
            <input type="checkbox" checked={config.autoImportManifest} onChange={(e) => setConfig({ ...config, autoImportManifest: e.target.checked })} />
            <span>Manifest otomatik içe aktar</span>
          </label>
          <FormField label="Senkron aralığı (saat)"><Input type="number" value={config.syncIntervalHours} onChange={(e) => setConfig({ ...config, syncIntervalHours: Number(e.target.value) })} /></FormField>
        </FormGrid>
        <div className="roomio-table-wrap" style={{ marginTop: 12 }}>
          <table className="roomio-table">
            <thead><tr><th>Operatör</th><th>Kod</th><th>Kontenjan</th><th>Release</th><th>Komisyon</th><th>Durum</th></tr></thead>
            <tbody>
              {config.operators.map((o) => (
                <tr key={o.id}><td>{o.name}</td><td>{o.code}</td><td>{o.allotmentRooms}</td><td>{o.releaseDays} gün</td><td>%{o.commissionPercent}</td><td>{o.enabled ? 'Aktif' : 'Kapalı'}</td></tr>
              ))}
            </tbody>
          </table>
        </div>
        <FormActions className="roomio-form-actions--spaced">
          <Button onClick={() => void save()}>Kaydet</Button>
          <Button variant="secondary" onClick={() => void test()}>Bağlantı testi</Button>
          <Button variant="secondary" onClick={() => void sync()}>Manifest senkron</Button>
        </FormActions>
        {saved ? <p className="roomio-page-desc">Kaydedildi.</p> : null}
        {testMsg ? <p className="roomio-page-desc">{testMsg}</p> : null}
        {syncMsg ? <p className="roomio-page-desc">{syncMsg}</p> : null}
      </FormSection>
    </PageHeader>
  );
}
