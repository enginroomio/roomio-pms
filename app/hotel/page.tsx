'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Globe } from 'lucide-react';

type WebsitePreview = {
  ok: boolean;
  siteName: string;
  domain: string;
  template: string;
  primaryColor: string;
  languages: string[];
  sections: {
    booking: boolean;
    gallery: boolean;
    spa: boolean;
  };
  bookingUrl: string;
};

const sectionLabels: Record<keyof WebsitePreview['sections'], string> = {
  booking: 'Online rezervasyon',
  gallery: 'Fotoğraf galerisi',
  spa: 'SPA & wellness',
};

export default function HotelPage() {
  const [preview, setPreview] = useState<WebsitePreview | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    void fetch('/api/integrations/website-builder/preview')
      .then((r) => r.json())
      .then((j: WebsitePreview) => {
        if (!j.ok) setError('Otel web sitesi şu an yayında değil');
        else setPreview(j);
      })
      .catch(() => setError('Site önizlemesi yüklenemedi'));
  }, []);

  return (
    <div className="roomio-public-portal">
      <div className="roomio-public-portal__card roomio-public-portal__card--wide">
        <div className="roomio-public-portal__brand">
          <Globe size={28} />
          <div>
            <strong>{preview?.siteName ?? 'Otel Web Sitesi'}</strong>
            <span>{preview?.domain ?? 'Website Builder önizleme'}</span>
          </div>
        </div>

        {preview ? (
          <>
            <p className="roomio-page-desc" style={{ marginTop: 16 }}>
              Şablon: <strong>{preview.template}</strong>
              {preview.languages?.length ? ` · Diller: ${preview.languages.join(', ')}` : ''}
            </p>

            {preview.sections ? (
              <ul className="roomio-page-desc" style={{ marginTop: 16 }}>
                {Object.entries(preview.sections).map(([key, on]) => (
                  <li key={key}>
                    {on ? '✓' : '○'} {sectionLabels[key as keyof WebsitePreview['sections']] ?? key}
                  </li>
                ))}
              </ul>
            ) : null}

            {preview.sections?.booking ? (
              <div className="roomio-form-actions--spaced" style={{ display: 'flex', gap: 12, marginTop: 20 }}>
                <Link className="roomio-btn roomio-btn--primary" href={preview.bookingUrl ?? '/book'}>
                  Rezervasyon Yap
                </Link>
              </div>
            ) : (
              <p className="roomio-page-desc" style={{ marginTop: 16 }}>
                <Link href="/book">Rezervasyon motoru</Link>
              </p>
            )}
          </>
        ) : !error ? (
          <p>Yükleniyor…</p>
        ) : null}

        {error ? <p className="roomio-public-portal__error">{error}</p> : null}

        <p className="roomio-page-desc" style={{ marginTop: 16 }}>
          <Link href="/guest">Misafir portalı</Link>
        </p>
      </div>
    </div>
  );
}
