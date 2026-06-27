'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Smartphone } from 'lucide-react';

type AppInfo = {
  ok: boolean;
  appName: string;
  iosStoreUrl: string;
  androidStoreUrl: string;
  deepLinkScheme: string;
  minAppVersion: string;
  features: Record<string, boolean>;
  deepLinks: Record<string, string>;
};

export default function GuestAppPage() {
  const [info, setInfo] = useState<AppInfo | null>(null);

  useEffect(() => {
    void fetch('/api/integrations/guest-app/info')
      .then((r) => r.json())
      .then(setInfo)
      .catch(() => null);
  }, []);

  const featureLabels: Record<string, string> = {
    checkIn: 'Online check-in',
    folio: 'Folyo görüntüleme',
    roomService: 'Oda servisi',
    spa: 'SPA rezervasyonu',
    activities: 'Aktiviteler (Viofun)',
    digitalKey: 'Dijital oda anahtarı',
  };

  return (
    <div className="roomio-public-portal">
      <div className="roomio-public-portal__card roomio-public-portal__card--wide">
        <div className="roomio-public-portal__brand">
          <Smartphone size={28} />
          <div>
            <strong>{info?.appName ?? 'Roomio Guest'}</strong>
            <span>Native misafir uygulaması</span>
          </div>
        </div>

        <p className="roomio-page-desc" style={{ marginTop: 16 }}>
          iOS ve Android uygulaması ile check-in, folyo, SPA ve aktivite rezervasyonlarına mobil erişim.
          Min. sürüm: <strong>{info?.minAppVersion ?? '2.1.0'}</strong>
        </p>

        <div className="roomio-form-actions--spaced" style={{ display: 'flex', gap: 12, marginTop: 16 }}>
          {info?.iosStoreUrl ? (
            <a className="roomio-btn roomio-btn--primary" href={info.iosStoreUrl} target="_blank" rel="noreferrer">App Store</a>
          ) : null}
          {info?.androidStoreUrl ? (
            <a className="roomio-btn roomio-btn--secondary" href={info.androidStoreUrl} target="_blank" rel="noreferrer">Google Play</a>
          ) : null}
          <Link className="roomio-btn roomio-btn--secondary" href="/guest">Web portalı</Link>
        </div>

        {info?.features ? (
          <ul className="roomio-page-desc" style={{ marginTop: 20 }}>
            {Object.entries(info.features).map(([key, on]) => (
              <li key={key}>{on ? '✓' : '○'} {featureLabels[key] ?? key}</li>
            ))}
          </ul>
        ) : null}

        {info?.deepLinks ? (
          <div style={{ marginTop: 16 }}>
            <p className="roomio-card-title">Deep link şeması: {info.deepLinkScheme}://</p>
            <ul className="roomio-page-desc">
              {Object.entries(info.deepLinks).map(([k, v]) => (
                <li key={k}><code>{v}</code></li>
              ))}
            </ul>
          </div>
        ) : null}
      </div>
    </div>
  );
}
