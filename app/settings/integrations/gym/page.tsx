'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { IntegrationPageLayout } from '@/components/sistem/IntegrationPageLayout';
import { FormActions, FormField, FormGrid, FormSection, Input } from '@/components/kit';
import { Button } from '@/components/ui';
import { roomioFetch } from '@/lib/client/api';
import { DEFAULT_GYM_CONFIG, type GymConfig } from '@/lib/integrations/gym/types';

export default function GymSettingsPage() {
  const [config, setConfig] = useState<GymConfig>(DEFAULT_GYM_CONFIG);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    void roomioFetch('/api/integrations/gym/config')
      .then((r) => r.json())
      .then((j: GymConfig) => setConfig({ ...DEFAULT_GYM_CONFIG, ...j }));
  }, []);

  async function save() {
    await roomioFetch('/api/integrations/gym/config', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(config),
    });
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  return (
    <IntegrationPageLayout
      segment={"Spor Salonu"}
      title={"Spor Salonu"}
      description={"Fitness salonu, ders programı ve online rezervasyon."}
      >
      <FormSection title="Spor Salonu">
        <FormGrid>
          <label className="roomio-field roomio-field--row">
            <input type="checkbox" checked={config.enabled} onChange={(e) => setConfig({ ...config, enabled: e.target.checked })} />
            <span>Spor salonu aktif</span>
          </label>
          <FormField label="Salon adı"><Input value={config.gymName} onChange={(e) => setConfig({ ...config, gymName: e.target.value })} /></FormField>
          <FormField label="Açılış"><Input type="time" value={config.openFrom} onChange={(e) => setConfig({ ...config, openFrom: e.target.value })} /></FormField>
          <FormField label="Kapanış"><Input type="time" value={config.openTo} onChange={(e) => setConfig({ ...config, openTo: e.target.value })} /></FormField>
          <label className="roomio-field roomio-field--row">
            <input type="checkbox" checked={config.allowOnlineBooking} onChange={(e) => setConfig({ ...config, allowOnlineBooking: e.target.checked })} />
            <span>Online rezervasyon</span>
          </label>
        </FormGrid>
        <FormActions className="roomio-form-actions--spaced">
          <Button onClick={() => void save()}>Kaydet</Button>
          <Button variant="secondary" href="/gym" target="_blank">Canlı önizleme</Button>
        </FormActions>
        {saved ? <p className="roomio-page-desc">Kaydedildi.</p> : null}
        <p className="roomio-page-desc" style={{ marginTop: 12 }}>
          Misafir URL: <Link href="/gym">/gym</Link> · {config.classes.filter((c) => c.available).length} aktif ders
        </p>
      </FormSection>

      <FormSection title="Dersler" className="roomio-form-section--spaced">
        <div className="roomio-table-wrap">
          <table className="roomio-table">
            <thead><tr><th>Ders</th><th>Eğitmen</th><th>Süre</th><th>Saat</th><th>Kontenjan</th><th>Durum</th></tr></thead>
            <tbody>
              {config.classes.map((c) => (
                <tr key={c.id}>
                  <td>{c.name}</td>
                  <td>{c.instructor}</td>
                  <td>{c.durationMinutes} dk</td>
                  <td>{c.schedule}</td>
                  <td>{c.maxParticipants}</td>
                  <td>{c.available ? 'Aktif' : 'Kapalı'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </FormSection>
    </IntegrationPageLayout>
  );
}
