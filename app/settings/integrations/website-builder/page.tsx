'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { IntegrationPageLayout } from '@/components/sistem/IntegrationPageLayout';
import { FormActions, FormField, FormGrid, FormSection, Input } from '@/components/kit';
import { Button } from '@/components/ui';
import { roomioFetch } from '@/lib/client/api';
import { DEFAULT_WEBSITE_BUILDER_CONFIG, type WebsiteBuilderConfig } from '@/lib/integrations/website-builder/types';

export default function WebsiteBuilderSettingsPage() {
  const [config, setConfig] = useState<WebsiteBuilderConfig>(DEFAULT_WEBSITE_BUILDER_CONFIG);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    void roomioFetch('/api/integrations/website-builder/config')
      .then((r) => r.json())
      .then((j: WebsiteBuilderConfig) => setConfig({ ...DEFAULT_WEBSITE_BUILDER_CONFIG, ...j }));
  }, []);

  async function save() {
    await roomioFetch('/api/integrations/website-builder/config', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(config),
    });
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  return (
    <IntegrationPageLayout
      segment={"Web Sitesi"}
      title={"Web Sitesi"}
      description={"Otel web sitesi — domain, şablon ve rezervasyon motoru entegrasyonu."}
      >
      <FormSection title="Site">
        <FormGrid>
          <label className="roomio-field roomio-field--row">
            <input type="checkbox" checked={config.enabled} onChange={(e) => setConfig({ ...config, enabled: e.target.checked })} />
            <span>Site aktif</span>
          </label>
          <FormField label="Site adı"><Input value={config.siteName} onChange={(e) => setConfig({ ...config, siteName: e.target.value })} /></FormField>
          <FormField label="Domain"><Input value={config.domain} onChange={(e) => setConfig({ ...config, domain: e.target.value })} /></FormField>
          <FormField label="Şablon">
            <select className="roomio-input" value={config.template} onChange={(e) => setConfig({ ...config, template: e.target.value })}>
              <option value="boutique">Boutique</option>
              <option value="resort">Resort</option>
              <option value="city">City</option>
              <option value="minimal">Minimal</option>
            </select>
          </FormField>
          <FormField label="Ana renk"><Input type="color" value={config.primaryColor} onChange={(e) => setConfig({ ...config, primaryColor: e.target.value })} /></FormField>
          <FormField label="Diller (virgülle)">
            <Input
              value={config.languages.join(', ')}
              onChange={(e) => setConfig({ ...config, languages: e.target.value.split(',').map((l) => l.trim()).filter(Boolean) })}
            />
          </FormField>
          <label className="roomio-field roomio-field--row">
            <input type="checkbox" checked={config.showBookingEngine} onChange={(e) => setConfig({ ...config, showBookingEngine: e.target.checked })} />
            <span>Rezervasyon motoru</span>
          </label>
          <label className="roomio-field roomio-field--row">
            <input type="checkbox" checked={config.showGallery} onChange={(e) => setConfig({ ...config, showGallery: e.target.checked })} />
            <span>Galeri</span>
          </label>
          <label className="roomio-field roomio-field--row">
            <input type="checkbox" checked={config.showSpa} onChange={(e) => setConfig({ ...config, showSpa: e.target.checked })} />
            <span>SPA bölümü</span>
          </label>
        </FormGrid>
        <FormActions className="roomio-form-actions--spaced">
          <Button onClick={() => void save()}>Kaydet</Button>
          <Button variant="secondary" href="/hotel" target="_blank">Canlı önizleme</Button>
        </FormActions>
        {saved ? <p className="roomio-page-desc">Kaydedildi.</p> : null}
        <p className="roomio-page-desc" style={{ marginTop: 12 }}>
          Önizleme: <Link href="/hotel">/hotel</Link> · {config.domain}
        </p>
      </FormSection>
    </IntegrationPageLayout>
  );
}
