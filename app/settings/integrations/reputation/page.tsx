'use client';

import { useEffect, useState } from 'react';
import { IntegrationPageLayout } from '@/components/sistem/IntegrationPageLayout';
import { FormActions, FormField, FormGrid, FormSection, Input } from '@/components/kit';
import { Button } from '@/components/ui';
import { roomioFetch } from '@/lib/client/api';
import { DEFAULT_REPUTATION_CONFIG, type ReputationConfig, type ReputationSource } from '@/lib/integrations/reputation/types';

export default function ReputationSettingsPage() {
  const [config, setConfig] = useState<ReputationConfig>(DEFAULT_REPUTATION_CONFIG);
  const [saved, setSaved] = useState(false);
  const [syncMsg, setSyncMsg] = useState<string | null>(null);

  useEffect(() => {
    void roomioFetch('/api/integrations/reputation/config')
      .then((r) => r.json())
      .then((j: ReputationConfig) => setConfig({ ...DEFAULT_REPUTATION_CONFIG, ...j }));
  }, []);

  async function save() {
    await roomioFetch('/api/integrations/reputation/config', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(config),
    });
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  async function sync() {
    const res = await roomioFetch('/api/integrations/reputation/sync', { method: 'POST' });
    const j = (await res.json()) as { message?: string };
    setSyncMsg(j.message ?? 'Senkron tamamlandı');
  }

  function toggleSource(source: ReputationSource) {
    const sources = config.sources.includes(source)
      ? config.sources.filter((s) => s !== source)
      : [...config.sources, source];
    setConfig({ ...config, sources });
  }

  const allSources: ReputationSource[] = ['booking', 'google', 'tripadvisor', 'internal'];

  return (
    <IntegrationPageLayout
      segment={"İtibar Yönetimi"}
      title={"İtibar Yönetimi"}
      description={"Booking, Google ve TripAdvisor yorumlarını tek panelde toplayın."}
      >
      <FormSection title="Senkron">
        <FormGrid>
          <label className="roomio-field roomio-field--row">
            <input type="checkbox" checked={config.enabled} onChange={(e) => setConfig({ ...config, enabled: e.target.checked })} />
            <span>Entegrasyon aktif</span>
          </label>
          <FormField label="Senkron aralığı (saat)"><Input type="number" value={config.syncIntervalHours} onChange={(e) => setConfig({ ...config, syncIntervalHours: Number(e.target.value) })} /></FormField>
          <FormField label="Düşük puan uyarısı"><Input type="number" value={config.minRatingAlert} onChange={(e) => setConfig({ ...config, minRatingAlert: Number(e.target.value) })} /></FormField>
          {allSources.map((s) => (
            <label key={s} className="roomio-field roomio-field--row">
              <input type="checkbox" checked={config.sources.includes(s)} onChange={() => toggleSource(s)} />
              <span>{s}</span>
            </label>
          ))}
        </FormGrid>
        <FormActions className="roomio-form-actions--spaced">
          <Button onClick={() => void save()}>Kaydet</Button>
          <Button variant="secondary" onClick={() => void sync()}>Yorumları senkronize et</Button>
        </FormActions>
        {saved ? <p className="roomio-page-desc">Kaydedildi.</p> : null}
        {syncMsg ? <p className="roomio-page-desc">{syncMsg}</p> : null}
      </FormSection>
    </IntegrationPageLayout>
  );
}
