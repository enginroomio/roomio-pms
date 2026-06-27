'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { IntegrationPageLayout } from '@/components/sistem/IntegrationPageLayout';
import { FormActions, FormField, FormGrid, FormSection, Input } from '@/components/kit';
import { Button } from '@/components/ui';
import { roomioFetch } from '@/lib/client/api';
import { DEFAULT_LITE_MOBILE_CONFIG, type LiteMobileConfig } from '@/lib/integrations/lite-mobile/types';

const FEATURE_LABELS: Record<keyof Pick<LiteMobileConfig, 'allowHousekeeping' | 'allowMaintenance' | 'allowGuestRequests' | 'allowMinibar' | 'offlineSync'>, string> = {
  allowHousekeeping: 'Kat hizmetleri',
  allowMaintenance: 'Teknik bakım',
  allowGuestRequests: 'Misafir talepleri',
  allowMinibar: 'Minibar',
  offlineSync: 'Çevrimdışı senkron',
};

export default function LiteMobileSettingsPage() {
  const [config, setConfig] = useState<LiteMobileConfig>(DEFAULT_LITE_MOBILE_CONFIG);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    void roomioFetch('/api/integrations/lite-mobile/config')
      .then((r) => r.json())
      .then((j: LiteMobileConfig) => setConfig({ ...DEFAULT_LITE_MOBILE_CONFIG, ...j }));
  }, []);

  async function save() {
    await roomioFetch('/api/integrations/lite-mobile/config', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(config),
    });
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  const featureKeys = Object.keys(FEATURE_LABELS) as Array<keyof typeof FEATURE_LABELS>;

  return (
    <IntegrationPageLayout
      segment={"Lite Mobile"}
      title={"Lite Mobile"}
      description={"Personel mobil uygulaması — kat hizmetleri, bakım ve misafir talepleri."}
      >
      <FormSection title="Uygulama">
        <FormGrid>
          <label className="roomio-field roomio-field--row">
            <input type="checkbox" checked={config.enabled} onChange={(e) => setConfig({ ...config, enabled: e.target.checked })} />
            <span>Uygulama aktif</span>
          </label>
          <FormField label="Uygulama adı"><Input value={config.appName} onChange={(e) => setConfig({ ...config, appName: e.target.value })} /></FormField>
          <FormField label="Min. sürüm"><Input value={config.minAppVersion} onChange={(e) => setConfig({ ...config, minAppVersion: e.target.value })} /></FormField>
          {featureKeys.map((key) => (
            <label key={key} className="roomio-field roomio-field--row">
              <input
                type="checkbox"
                checked={config[key]}
                onChange={(e) => setConfig({ ...config, [key]: e.target.checked })}
              />
              <span>{FEATURE_LABELS[key]}</span>
            </label>
          ))}
        </FormGrid>
        <FormActions className="roomio-form-actions--spaced">
          <Button onClick={() => void save()}>Kaydet</Button>
          <Button variant="secondary" href="/staff" target="_blank">Personel önizleme</Button>
        </FormActions>
        {saved ? <p className="roomio-page-desc">Kaydedildi.</p> : null}
        <p className="roomio-page-desc" style={{ marginTop: 12 }}>Önizleme: <Link href="/staff">/staff</Link></p>
      </FormSection>
    </IntegrationPageLayout>
  );
}
