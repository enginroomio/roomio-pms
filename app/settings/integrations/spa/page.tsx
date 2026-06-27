'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { IntegrationPageLayout } from '@/components/sistem/IntegrationPageLayout';
import { FormActions, FormField, FormGrid, FormSection, Input } from '@/components/kit';
import { Button } from '@/components/ui';
import { roomioFetch } from '@/lib/client/api';
import { DEFAULT_SPA_CONFIG, type SpaConfig } from '@/lib/spa/types';

export default function SpaSettingsPage() {
  const [config, setConfig] = useState<SpaConfig>(DEFAULT_SPA_CONFIG);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    void roomioFetch('/api/spa/config')
      .then((r) => r.json())
      .then((j: SpaConfig) => setConfig({ ...DEFAULT_SPA_CONFIG, ...j }));
  }, []);

  async function save() {
    await roomioFetch('/api/spa/config', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(config),
    });
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  return (
    <IntegrationPageLayout
      segment={"SPA Yönetimi"}
      title={"SPA Yönetimi"}
      description={"Tedavi kataloğu, çalışma saatleri ve online rezervasyon."}
      >
      <FormSection title="SPA">
        <FormGrid>
          <label className="roomio-field roomio-field--row">
            <input type="checkbox" checked={config.enabled} onChange={(e) => setConfig({ ...config, enabled: e.target.checked })} />
            <span>SPA aktif</span>
          </label>
          <FormField label="SPA adı"><Input value={config.hotelName} onChange={(e) => setConfig({ ...config, hotelName: e.target.value })} /></FormField>
          <FormField label="Açılış"><Input type="time" value={config.openFrom} onChange={(e) => setConfig({ ...config, openFrom: e.target.value })} /></FormField>
          <FormField label="Kapanış"><Input type="time" value={config.openTo} onChange={(e) => setConfig({ ...config, openTo: e.target.value })} /></FormField>
          <label className="roomio-field roomio-field--row">
            <input type="checkbox" checked={config.allowOnlineBooking} onChange={(e) => setConfig({ ...config, allowOnlineBooking: e.target.checked })} />
            <span>Online rezervasyon</span>
          </label>
        </FormGrid>
        <FormActions className="roomio-form-actions--spaced">
          <Button onClick={() => void save()}>Kaydet</Button>
          <Button variant="secondary" href="/spa" target="_blank">Canlı önizleme</Button>
        </FormActions>
        {saved ? <p className="roomio-page-desc">Kaydedildi.</p> : null}
        <p className="roomio-page-desc" style={{ marginTop: 12 }}>
          Misafir URL: <Link href="/spa">/spa</Link> · {config.treatments.filter((t) => t.available).length} tedavi
        </p>
      </FormSection>
      <FormSection title="Tedaviler" className="roomio-form-section--spaced">
        <div className="roomio-table-wrap">
          <table className="roomio-table">
            <thead><tr><th>Tedavi</th><th>Süre</th><th>Fiyat</th><th>Durum</th></tr></thead>
            <tbody>
              {config.treatments.map((t) => (
                <tr key={t.id}><td>{t.name}</td><td>{t.durationMinutes} dk</td><td>{t.price} {t.currency}</td><td>{t.available ? 'Aktif' : 'Kapalı'}</td></tr>
              ))}
            </tbody>
          </table>
        </div>
      </FormSection>
    </IntegrationPageLayout>
  );
}
