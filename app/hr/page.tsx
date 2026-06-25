'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Users } from 'lucide-react';

type HrPortalInfo = {
  ok: boolean;
  appName: string;
  features: Record<string, boolean>;
};

export default function HrPortalPage() {
  const [info, setInfo] = useState<HrPortalInfo | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    void fetch('/api/integrations/hr-portal/info')
      .then((r) => r.json())
      .then((j: HrPortalInfo) => {
        if (!j.ok) setError('IK portalı şu an kapalı');
        else setInfo(j);
      })
      .catch(() => setError('Portal bilgisi yüklenemedi'));
  }, []);

  const featureLabels: Record<string, string> = {
    leaveRequests: 'İzin talepleri',
    shiftSwap: 'Vardiya değişimi',
    payrollView: 'Bordro görüntüleme',
    training: 'Eğitim modülü',
  };

  return (
    <div className="roomio-public-portal">
      <div className="roomio-public-portal__card roomio-public-portal__card--wide">
        <div className="roomio-public-portal__brand">
          <Users size={28} />
          <div>
            <strong>{info?.appName ?? 'IK Mobil Portal'}</strong>
            <span>Personel self-servis</span>
          </div>
        </div>

        {info ? (
          <p className="roomio-page-desc" style={{ marginTop: 16 }}>
            İzin, vardiya, bordro ve eğitim işlemlerini mobil uygulama üzerinden yönetin.
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
          <Link className="roomio-btn roomio-btn--secondary" href="/staff">Lite Mobile</Link>
          <Link className="roomio-btn roomio-btn--secondary" href="/housekeeping/mobile">Kat hizmetleri</Link>
        </div>
      </div>
    </div>
  );
}
