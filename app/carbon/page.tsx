'use client';

import { useEffect, useState, type FormEvent } from 'react';
import Link from 'next/link';
import { Leaf } from 'lucide-react';
import type { CarbonOffsetQuote } from '@/lib/integrations/carbon/types';

type CarbonInfo = {
  ok: boolean;
  co2PerNightKg: number;
  offsetCostPerKg: number;
  currency: string;
  autoOfferOnBooking: boolean;
  showGuestBadge: boolean;
  provider: string;
};

export default function CarbonPage() {
  const [info, setInfo] = useState<CarbonInfo | null>(null);
  const [nights, setNights] = useState('3');
  const [quote, setQuote] = useState<CarbonOffsetQuote | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    void fetch('/api/integrations/carbon/info')
      .then((r) => r.json())
      .then((j: CarbonInfo) => {
        if (!j.ok) setError('Karbon dengeleme şu an kapalı');
        else setInfo(j);
      })
      .catch(() => setError('Bilgi yüklenemedi'));
  }, []);

  async function requestQuote(e: FormEvent) {
    e.preventDefault();
    setQuote(null);
    setError(null);
    const res = await fetch('/api/integrations/carbon/quote', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ nights: Number(nights) }),
    });
    const j = (await res.json()) as CarbonOffsetQuote & { message?: string };
    if (!j.ok) setError(j.message ?? 'Teklif alınamadı');
    else setQuote(j);
  }

  return (
    <div className="roomio-public-portal">
      <div className="roomio-public-portal__card roomio-public-portal__card--wide">
        <div className="roomio-public-portal__brand">
          <Leaf size={28} />
          <div>
            <strong>Karbon Dengeleme</strong>
            <span>{info?.provider ?? 'Gold Standard'} sertifikalı</span>
          </div>
        </div>

        {info ? (
          <p className="roomio-page-desc" style={{ marginTop: 16 }}>
            Konaklama başına yaklaşık <strong>{info.co2PerNightKg} kg CO₂</strong>.
            Dengeleme maliyeti: <strong>{info.offsetCostPerKg} {info.currency}/kg</strong>.
            {info.showGuestBadge ? ' Yeşil konaklama rozeti dahil.' : null}
          </p>
        ) : !error ? <p>Yükleniyor…</p> : null}

        {info?.ok ? (
          <form className="roomio-public-portal__stack" style={{ marginTop: 20 }} onSubmit={(e) => void requestQuote(e)}>
            <label className="roomio-field">
              <span>Gece sayısı</span>
              <input
                className="roomio-input"
                type="number"
                min={1}
                value={nights}
                onChange={(e) => setNights(e.target.value)}
                required
              />
            </label>
            <button className="roomio-btn roomio-btn--primary" type="submit">
              CO₂ Teklifi Al
            </button>
          </form>
        ) : null}

        {quote?.ok ? (
          <div className="roomio-card" style={{ marginTop: 20 }}>
            <p className="roomio-card-title">{quote.nights} gece konaklama</p>
            <p className="roomio-page-desc">
              Toplam emisyon: <strong>{quote.totalCo2Kg} kg CO₂</strong>
            </p>
            <p className="roomio-page-desc">
              Dengeleme maliyeti: <strong>{quote.offsetCost} {quote.currency}</strong>
            </p>
            {quote.certificatePreview ? (
              <p className="roomio-page-desc" style={{ marginTop: 8 }}>{quote.certificatePreview}</p>
            ) : null}
          </div>
        ) : null}

        {error ? <p className="roomio-public-portal__error">{error}</p> : null}

        <p className="roomio-page-desc" style={{ marginTop: 16 }}>
          <Link href="/guest">Misafir portalı</Link>
        </p>
      </div>
    </div>
  );
}
