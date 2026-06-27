'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { IntegrationPageLayout } from '@/components/sistem/IntegrationPageLayout';
import { FormActions, FormGrid, FormSection } from '@/components/kit';
import { Button } from '@/components/ui';
import { roomioFetch } from '@/lib/client/api';
import { DEFAULT_GUEST_PORTAL_CONFIG, type GuestPortalConfig } from '@/lib/guest-portal/types';

export default function GuestPortalSettingsPage() {
  const [config, setConfig] = useState<GuestPortalConfig>(DEFAULT_GUEST_PORTAL_CONFIG);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    void roomioFetch('/api/guest-portal/config')
      .then((r) => r.json())
      .then((j: GuestPortalConfig) => setConfig({ ...DEFAULT_GUEST_PORTAL_CONFIG, ...j }));
  }, []);

  async function save() {
    await roomioFetch('/api/guest-portal/config', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(config),
    });
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  const toggles: Array<{ key: keyof GuestPortalConfig; label: string }> = [
    { key: 'enabled', label: 'Portal aktif' },
    { key: 'allowOnlineCheckIn', label: 'Online check-in' },
    { key: 'allowFolioView', label: 'Folyo görüntüleme' },
    { key: 'allowEinvoiceRequest', label: 'e-Fatura talebi' },
    { key: 'allowServiceRequests', label: 'Servis talepleri' },
    { key: 'qrCheckInEnabled', label: 'QR check-in' },
  ];

  return (
    <IntegrationPageLayout
      segment={"Misafir Self-Servis Portalı"}
      title={"Misafir Self-Servis Portalı"}
      description={"QR / token ile check-in, folyo ve e-fatura — ElektraWeb misafir uygulaması web sürümü."}
      >
      <FormSection title="Özellikler">
        <FormGrid>
          {toggles.map((t) => (
            <label key={t.key} className="roomio-field roomio-field--row">
              <input
                type="checkbox"
                checked={!!config[t.key]}
                onChange={(e) => setConfig({ ...config, [t.key]: e.target.checked })}
              />
              <span>{t.label}</span>
            </label>
          ))}
        </FormGrid>
        <FormActions className="roomio-form-actions--spaced">
          <Button onClick={() => void save()}>Kaydet</Button>
          <Button variant="secondary" href="/guest" target="_blank">Canlı önizleme</Button>
        </FormActions>
        {saved ? <p className="roomio-page-desc">Kaydedildi.</p> : null}
        <p className="roomio-page-desc" style={{ marginTop: 12 }}>
          Misafir URL: <Link href="/guest">/guest</Link> · Online rezervasyon sonrası otomatik token üretilir.
        </p>
      </FormSection>
    </IntegrationPageLayout>
  );
}
