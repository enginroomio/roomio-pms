'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Smartphone } from 'lucide-react';

type StaffAppInfo = {
  ok: boolean;
  appName: string;
  minAppVersion: string;
  features: Record<string, boolean>;
};

export default function StaffAppPage() {
  const [info, setInfo] = useState<StaffAppInfo | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    void fetch('/api/integrations/lite-mobile/info')
      .then((r) => r.json())
      .then((j: StaffAppInfo) => {
        if (!j.ok) setError('Lite Mobile şu an kapalı');
        else setInfo(j);
      })
      .catch(() => setError('Uygulama bilgisi yüklenemedi'));
  }, []);

  const featureLabels: Record<string, string> = {
    housekeeping: 'Kat hizmetleri',
    maintenance: 'Bakım talepleri',
    guestRequests: 'Misafir talepleri',
    minibar: 'Minibar',
    offlineSync: 'Çevrimdışı senkron',
  };

  return (
    <div className="roomio-public-portal">
      <div className="roomio-public-portal__card roomio-public-portal__card--wide">
        <div className="roomio-public-portal__brand">
          <Smartphone size={28} />
          <div>
            <strong>{info?.appName ?? 'Lite Mobile'}</strong>
            <span>Personel mobil uygulaması</span>
          </div>
        </div>

        {info ? (
          <p className="roomio-page-desc" style={{ marginTop: 16 }}>
            Kat hizmetleri, bakım ve misafir taleplerini sahada yönetmek için native mobil uygulama.
            Min. sürüm: <strong>{info.minAppVersion}</strong>
          </p>
        ) : !error ? <p>Yükleniyor…</p> : null}

        {info?.features ? (
          <ul className="roomio-page-desc" style={{ marginTop: 20 }}>
            {Object.entries(info.features).map(([key, on]) => (
              <li key={key}>{on ? '✓' : '○'} {featureLabels[key] ?? key}</li>
            ))}
          </ul>
        ) : null}

        {error ? <p className="roomio-public-portal__error">{error}</p> : null}

        <div className="roomio-form-actions--spaced" style={{ display: 'flex', gap: 12, marginTop: 16 }}>
          <Link className="roomio-btn roomio-btn--secondary" href="/housekeeping/mobile">Web mobil görünüm</Link>
          <Link className="roomio-btn roomio-btn--secondary" href="/guest">Misafir portalı</Link>
        </div>
      </div>
    </div>
  );
}
