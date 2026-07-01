'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { IntegrationPageLayout } from '@/components/sistem/IntegrationPageLayout';
import { FormActions, FormGrid, FormSection } from '@/components/kit';
import { Button } from '@/components/ui';
import { roomioFetch } from '@/lib/client/api';
import {
  DEFAULT_GUEST_PORTAL_CONFIG,
  DEFAULT_GUEST_SERVICE_LINKS,
  type GuestPortalConfig,
  type GuestServiceKey,
} from '@/lib/guest-portal/types';

const SERVICE_LINK_LABELS: Array<{ key: GuestServiceKey; label: string }> = [
  { key: 'restaurant', label: 'Restoran rezervasyonu' },
  { key: 'roomService', label: 'Oda servisi siparişi' },
  { key: 'carbon', label: 'Karbon dengeleme' },
  { key: 'spa', label: 'SPA & Wellness' },
  { key: 'gym', label: 'Spor salonu' },
  { key: 'fair', label: 'Fuar & etkinlik' },
  { key: 'hotel', label: 'Otel web sitesi' },
  { key: 'viofun', label: 'Aktiviteler' },
  { key: 'menu', label: 'Dijital menü' },
];

export default function GuestPortalSettingsPage() {
  const [config, setConfig] = useState<GuestPortalConfig>(DEFAULT_GUEST_PORTAL_CONFIG);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    void roomioFetch('/api/guest-portal/config')
      .then((r) => r.json())
      .then((j: GuestPortalConfig) =>
        setConfig({
          ...DEFAULT_GUEST_PORTAL_CONFIG,
          ...j,
          serviceLinks: { ...DEFAULT_GUEST_SERVICE_LINKS, ...j.serviceLinks },
        }),
      );
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

      <FormSection title="Hizmet bağlantıları">
        <p className="roomio-page-desc">
          Otelin sunmadığı veya misafir panelinde göstermek istemediği hizmetleri kapatın — kapatılan bağlantı
          /guest ve /book sayfalarında görünmez.
        </p>
        <FormGrid>
          {SERVICE_LINK_LABELS.map((s) => (
            <label key={s.key} className="roomio-field roomio-field--row">
              <input
                type="checkbox"
                checked={config.serviceLinks?.[s.key] ?? true}
                onChange={(e) =>
                  setConfig({
                    ...config,
                    serviceLinks: { ...DEFAULT_GUEST_SERVICE_LINKS, ...config.serviceLinks, [s.key]: e.target.checked },
                  })
                }
              />
              <span>{s.label}</span>
            </label>
          ))}
        </FormGrid>
        <FormActions className="roomio-form-actions--spaced">
          <Button onClick={() => void save()}>Kaydet</Button>
        </FormActions>
        {saved ? <p className="roomio-page-desc">Kaydedildi.</p> : null}
      </FormSection>
    </IntegrationPageLayout>
  );
}
