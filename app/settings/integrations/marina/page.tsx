'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { IntegrationPageLayout } from '@/components/sistem/IntegrationPageLayout';
import { FormActions, FormField, FormGrid, FormSection, Input } from '@/components/kit';
import { Button } from '@/components/ui';
import { roomioFetch } from '@/lib/client/api';
import { DEFAULT_MARINA_CONFIG, type MarinaConfig } from '@/lib/integrations/marina/types';

export default function MarinaSettingsPage() {
  const [config, setConfig] = useState<MarinaConfig>(DEFAULT_MARINA_CONFIG);
  const [saved, setSaved] = useState(false);
  const [testMsg, setTestMsg] = useState<string | null>(null);

  useEffect(() => {
    void roomioFetch('/api/integrations/marina/config')
      .then((r) => r.json())
      .then((j: MarinaConfig) => setConfig({ ...DEFAULT_MARINA_CONFIG, ...j }));
  }, []);

  async function save() {
    await roomioFetch('/api/integrations/marina/config', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(config),
    });
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  async function test() {
    const res = await roomioFetch('/api/integrations/marina/config?test=1', { method: 'POST' });
    const j = (await res.json()) as { message?: string };
    setTestMsg(j.message ?? 'Test tamamlandı');
  }

  return (
    <IntegrationPageLayout
      segment={"Marina Yönetimi"}
      title={"Marina Yönetimi"}
      description={"Rıhtım envanteri, tekne bağlama ve online rezervasyon."}
      >
      <FormSection title="Marina">
        <FormGrid>
          <label className="roomio-field roomio-field--row">
            <input type="checkbox" checked={config.enabled} onChange={(e) => setConfig({ ...config, enabled: e.target.checked })} />
            <span>Marina aktif</span>
          </label>
          <FormField label="Marina adı"><Input value={config.marinaName} onChange={(e) => setConfig({ ...config, marinaName: e.target.value })} /></FormField>
          <FormField label="Toplam rıhtım"><Input type="number" value={config.totalBerths} onChange={(e) => setConfig({ ...config, totalBerths: Number(e.target.value) })} /></FormField>
          <FormField label="Check-in"><Input type="time" value={config.checkInTime} onChange={(e) => setConfig({ ...config, checkInTime: e.target.value })} /></FormField>
          <FormField label="Check-out"><Input type="time" value={config.checkOutTime} onChange={(e) => setConfig({ ...config, checkOutTime: e.target.value })} /></FormField>
          <label className="roomio-field roomio-field--row">
            <input type="checkbox" checked={config.allowOnlineBooking} onChange={(e) => setConfig({ ...config, allowOnlineBooking: e.target.checked })} />
            <span>Online rezervasyon</span>
          </label>
        </FormGrid>
        <div className="roomio-table-wrap" style={{ marginTop: 12 }}>
          <table className="roomio-table">
            <thead><tr><th>Rıhtım</th><th>Boyut</th><th>Derinlik</th><th>Günlük</th><th>Durum</th></tr></thead>
            <tbody>
              {config.berths.map((b) => (
                <tr key={b.id}><td>{b.name}</td><td>{b.lengthM}×{b.widthM}m</td><td>{b.depthM}m</td><td>{b.dailyRate} {b.currency}</td><td>{b.available ? 'Müsait' : 'Dolu'}</td></tr>
              ))}
            </tbody>
          </table>
        </div>
        <FormActions className="roomio-form-actions--spaced">
          <Button onClick={() => void save()}>Kaydet</Button>
          <Button variant="secondary" onClick={() => void test()}>Bağlantı testi</Button>
          <Button variant="secondary" href="/marina" target="_blank">Canlı önizleme</Button>
        </FormActions>
        {saved ? <p className="roomio-page-desc">Kaydedildi.</p> : null}
        {testMsg ? <p className="roomio-page-desc">{testMsg}</p> : null}
        <p className="roomio-page-desc" style={{ marginTop: 12 }}>Misafir URL: <Link href="/marina">/marina</Link></p>
      </FormSection>
    </IntegrationPageLayout>
  );
}
