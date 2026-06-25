'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { PageHeader } from '@/components/PageHeader';
import { FormActions, FormField, FormGrid, FormSection, Input } from '@/components/kit';
import { Button } from '@/components/ui';
import { roomioFetch } from '@/lib/client/api';
import { DEFAULT_GUEST_APP_CONFIG, type GuestAppConfig } from '@/lib/integrations/guest-app/types';

export default function GuestAppSettingsPage() {
  const [config, setConfig] = useState<GuestAppConfig>(DEFAULT_GUEST_APP_CONFIG);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    void roomioFetch('/api/integrations/guest-app/config')
      .then((r) => r.json())
      .then((j: GuestAppConfig) => setConfig({ ...DEFAULT_GUEST_APP_CONFIG, ...j }));
  }, []);

  async function save() {
    await roomioFetch('/api/integrations/guest-app/config', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(config),
    });
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  const featureKeys = Object.keys(config.features) as Array<keyof GuestAppConfig['features']>;

  return (
    <PageHeader
      breadcrumb="Ayarlar > Misafir Uygulaması"
      title="Native Misafir Uygulaması"
      description="iOS/Android branded app — deep link, push ve özellik bayrakları."
      actions={<Button variant="secondary" href="/settings/integrations">← Entegrasyonlar</Button>}
    >
      <FormSection title="Uygulama">
        <FormGrid>
          <label className="roomio-field roomio-field--row">
            <input type="checkbox" checked={config.enabled} onChange={(e) => setConfig({ ...config, enabled: e.target.checked })} />
            <span>Uygulama aktif</span>
          </label>
          <FormField label="Uygulama adı"><Input value={config.appName} onChange={(e) => setConfig({ ...config, appName: e.target.value })} /></FormField>
          <FormField label="Bundle ID"><Input value={config.bundleId} onChange={(e) => setConfig({ ...config, bundleId: e.target.value })} /></FormField>
          <FormField label="Deep link şeması"><Input value={config.deepLinkScheme} onChange={(e) => setConfig({ ...config, deepLinkScheme: e.target.value })} /></FormField>
          <FormField label="Min. sürüm"><Input value={config.minAppVersion} onChange={(e) => setConfig({ ...config, minAppVersion: e.target.value })} /></FormField>
          <FormField label="App Store URL"><Input value={config.iosStoreUrl} onChange={(e) => setConfig({ ...config, iosStoreUrl: e.target.value })} /></FormField>
          <FormField label="Google Play URL"><Input value={config.androidStoreUrl} onChange={(e) => setConfig({ ...config, androidStoreUrl: e.target.value })} /></FormField>
          <label className="roomio-field roomio-field--row">
            <input type="checkbox" checked={config.pushEnabled} onChange={(e) => setConfig({ ...config, pushEnabled: e.target.checked })} />
            <span>Push bildirimleri</span>
          </label>
          {featureKeys.map((key) => (
            <label key={key} className="roomio-field roomio-field--row">
              <input
                type="checkbox"
                checked={config.features[key]}
                onChange={(e) => setConfig({ ...config, features: { ...config.features, [key]: e.target.checked } })}
              />
              <span>{key}</span>
            </label>
          ))}
        </FormGrid>
        <FormActions className="roomio-form-actions--spaced">
          <Button onClick={() => void save()}>Kaydet</Button>
          <Button variant="secondary" href="/app" target="_blank">İndirme sayfası</Button>
        </FormActions>
        {saved ? <p className="roomio-page-desc">Kaydedildi.</p> : null}
        <p className="roomio-page-desc" style={{ marginTop: 12 }}>Landing: <Link href="/app">/app</Link></p>
      </FormSection>
    </PageHeader>
  );
}
