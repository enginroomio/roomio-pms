'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { PageHeader } from '@/components/PageHeader';
import { FormActions, FormField, FormGrid, FormSection, Input } from '@/components/kit';
import { Button } from '@/components/ui';
import { roomioFetch } from '@/lib/client/api';
import { DEFAULT_FAIR_EVENTS_CONFIG, type FairEventsConfig } from '@/lib/integrations/fair-events/types';

export default function FairEventsSettingsPage() {
  const [config, setConfig] = useState<FairEventsConfig>(DEFAULT_FAIR_EVENTS_CONFIG);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    void roomioFetch('/api/integrations/fair-events/config')
      .then((r) => r.json())
      .then((j: FairEventsConfig) => setConfig({ ...DEFAULT_FAIR_EVENTS_CONFIG, ...j }));
  }, []);

  async function save() {
    await roomioFetch('/api/integrations/fair-events/config', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(config),
    });
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  return (
    <PageHeader
      breadcrumb="Ayarlar > Fuar Otomasyon"
      title="Fuar Otomasyon"
      description="Etkinlik yönetimi, online kayıt ve QR check-in."
      actions={<Button variant="secondary" href="/settings/integrations">← Entegrasyonlar</Button>}
    >
      <FormSection title="Fuar">
        <FormGrid>
          <label className="roomio-field roomio-field--row">
            <input type="checkbox" checked={config.enabled} onChange={(e) => setConfig({ ...config, enabled: e.target.checked })} />
            <span>Entegrasyon aktif</span>
          </label>
          <FormField label="Organizatör adı"><Input value={config.organizerName} onChange={(e) => setConfig({ ...config, organizerName: e.target.value })} /></FormField>
          <label className="roomio-field roomio-field--row">
            <input type="checkbox" checked={config.allowOnlineRegistration} onChange={(e) => setConfig({ ...config, allowOnlineRegistration: e.target.checked })} />
            <span>Online kayıt</span>
          </label>
          <label className="roomio-field roomio-field--row">
            <input type="checkbox" checked={config.qrCheckIn} onChange={(e) => setConfig({ ...config, qrCheckIn: e.target.checked })} />
            <span>QR check-in</span>
          </label>
        </FormGrid>
        <FormActions className="roomio-form-actions--spaced">
          <Button onClick={() => void save()}>Kaydet</Button>
          <Button variant="secondary" href="/fair" target="_blank">Canlı önizleme</Button>
        </FormActions>
        {saved ? <p className="roomio-page-desc">Kaydedildi.</p> : null}
        <p className="roomio-page-desc" style={{ marginTop: 12 }}>
          Misafir URL: <Link href="/fair">/fair</Link> · {config.events.filter((e) => e.open).length} açık etkinlik
        </p>
      </FormSection>

      <FormSection title="Etkinlikler" className="roomio-form-section--spaced">
        <div className="roomio-table-wrap">
          <table className="roomio-table">
            <thead><tr><th>Etkinlik</th><th>Mekan</th><th>Tarih</th><th>Kayıt</th><th>Durum</th></tr></thead>
            <tbody>
              {config.events.map((e) => (
                <tr key={e.id}>
                  <td>{e.name}</td>
                  <td>{e.venue}</td>
                  <td>{e.startDate}{e.endDate !== e.startDate ? ` — ${e.endDate}` : ''}</td>
                  <td>{e.registered} / {e.capacity}</td>
                  <td>{e.open ? 'Açık' : 'Kapalı'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </FormSection>
    </PageHeader>
  );
}
