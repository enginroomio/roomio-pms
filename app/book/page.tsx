'use client';

import { Suspense, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { Calendar, CreditCard, Hotel, Leaf } from 'lucide-react';
import { GuestServiceLinks } from '@/components/GuestServiceLinks';
import { PROPERTY } from '@/lib/navigation';
import type { OnlineBookingResult } from '@/lib/booking-engine/types';
import type { CarbonOffsetQuote } from '@/lib/integrations/carbon/types';

type AvailDay = {
  date: string;
  roomType: string;
  available: number;
  rate: number;
  currency: string;
};

const ROOM_LABELS: Record<string, string> = {
  SGL: 'Tek Kişilik',
  DBL: 'Çift Kişilik',
  TWN: 'İkiz Yatak',
  TRP: 'Üç Kişilik',
  SUI: 'Suit',
};

function BookingForm() {
  const tomorrow = useMemo(() => {
    const d = new Date();
    d.setDate(d.getDate() + 1);
    return d.toISOString().slice(0, 10);
  }, []);
  const dayAfter = useMemo(() => {
    const d = new Date();
    d.setDate(d.getDate() + 3);
    return d.toISOString().slice(0, 10);
  }, []);

  const [hotelName, setHotelName] = useState(PROPERTY.name);
  const [headline, setHeadline] = useState('');
  const [checkIn, setCheckIn] = useState(tomorrow);
  const [checkOut, setCheckOut] = useState(dayAfter);
  const [roomType, setRoomType] = useState('DBL');
  const [guestName, setGuestName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<'card' | 'hotel'>('hotel');
  const [cardLast4, setCardLast4] = useState('');
  const [availability, setAvailability] = useState<AvailDay[]>([]);
  const [currency, setCurrency] = useState('TRY');
  const [requirePrepayment, setRequirePrepayment] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<OnlineBookingResult | null>(null);
  const [carbonOffer, setCarbonOffer] = useState<CarbonOffsetQuote | null>(null);

  useEffect(() => {
    if (!result?.ok) {
      setCarbonOffer(null);
      return;
    }
    const nights = Math.max(
      1,
      Math.round((new Date(checkOut).getTime() - new Date(checkIn).getTime()) / 86_400_000),
    );
    void fetch('/api/integrations/carbon/info')
      .then((r) => r.json())
      .then((info: { ok?: boolean; autoOfferOnBooking?: boolean }) => {
        if (!info.ok || !info.autoOfferOnBooking) return null;
        return fetch('/api/integrations/carbon/quote', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ nights }),
        }).then((r) => r.json());
      })
      .then((q: CarbonOffsetQuote | null) => {
        if (q?.ok) setCarbonOffer(q);
      })
      .catch(() => null);
  }, [result, checkIn, checkOut]);

  useEffect(() => {
    if (!checkIn || !checkOut || checkOut <= checkIn) return;
    void fetch(`/api/booking/availability?checkIn=${checkIn}&checkOut=${checkOut}`)
      .then((r) => r.json())
      .then((j: {
        ok: boolean;
        days?: AvailDay[];
        hotelName?: string;
        headline?: string;
        currency?: string;
        requirePrepayment?: boolean;
        message?: string;
      }) => {
        if (j.hotelName) setHotelName(j.hotelName);
        if (j.headline) setHeadline(j.headline);
        if (j.currency) setCurrency(j.currency);
        setRequirePrepayment(!!j.requirePrepayment);
        setAvailability(j.days ?? []);
      });
  }, [checkIn, checkOut]);

  const quote = useMemo(() => {
    const nights = availability.filter((d) => d.roomType === roomType);
    const total = nights.reduce((s, d) => s + d.rate, 0);
    const minAvail = nights.length ? Math.min(...nights.map((d) => d.available)) : 0;
    return { total, minAvail, nights: nights.length };
  }, [availability, roomType]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const res = await fetch('/api/booking/reserve', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        guestName,
        email,
        phone,
        checkIn,
        checkOut,
        roomType,
        adults: 2,
        paymentMethod,
        cardLast4: paymentMethod === 'card' ? cardLast4 : undefined,
      }),
    });
    const j = (await res.json()) as OnlineBookingResult;
    setLoading(false);
    if (!j.ok) {
      setError(j.message);
      return;
    }
    setResult(j);
  }

  if (result?.ok) {
    const guestUrl = result.guestPortalToken
      ? `/guest?token=${encodeURIComponent(result.guestPortalToken)}`
      : '/guest';
    return (
      <div className="roomio-public-portal">
        <div className="roomio-public-portal__card roomio-public-portal__card--wide">
          <div className="roomio-public-portal__success">
            <h2>Rezervasyon Onaylandı</h2>
            <p>{result.message}</p>
            <p><strong>Referans:</strong> {result.refNo}</p>
            {result.totalAmount != null ? (
              <p><strong>Toplam:</strong> {result.totalAmount} {result.currency}</p>
            ) : null}
            {carbonOffer ? (
              <div className="roomio-card" style={{ marginTop: 16, textAlign: 'left' }}>
                <p className="roomio-card-title"><Leaf size={16} /> Karbon dengeleme</p>
                <p className="roomio-page-desc">
                  {carbonOffer.nights} gece için yaklaşık <strong>{carbonOffer.totalCo2Kg} kg CO₂</strong>.
                  Dengeleme: <strong>{carbonOffer.offsetCost} {carbonOffer.currency}</strong>
                </p>
                <Link className="roomio-btn roomio-btn--secondary" href="/carbon">Offset seçeneklerini gör</Link>
              </div>
            ) : null}
            <a className="roomio-btn roomio-btn--primary" href={guestUrl} style={{ marginTop: 16 }}>
              Misafir Portalına Git
            </a>
            <GuestServiceLinks />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="roomio-public-portal">
      <div className="roomio-public-portal__card roomio-public-portal__card--wide">
        <div className="roomio-public-portal__brand">
          <Hotel size={28} />
          <div>
            <strong>{hotelName}</strong>
            <span>{headline || 'Online Rezervasyon Motoru'}</span>
          </div>
        </div>

        <form className="roomio-public-portal__grid" onSubmit={(e) => void submit(e)}>
          <label className="roomio-field">
            <span>Giriş</span>
            <input className="roomio-input" type="date" required value={checkIn} onChange={(e) => setCheckIn(e.target.value)} />
          </label>
          <label className="roomio-field">
            <span>Çıkış</span>
            <input className="roomio-input" type="date" required value={checkOut} onChange={(e) => setCheckOut(e.target.value)} />
          </label>
          <label className="roomio-field roomio-field--full">
            <span>Oda tipi</span>
            <select className="roomio-input" value={roomType} onChange={(e) => setRoomType(e.target.value)}>
              {Object.entries(ROOM_LABELS).map(([code, label]) => (
                <option key={code} value={code}>{label} ({code})</option>
              ))}
            </select>
          </label>

          {quote.nights > 0 ? (
            <p className="roomio-page-desc roomio-field--full">
              <Calendar size={14} style={{ verticalAlign: 'middle' }} />
              {' '}{quote.nights} gece · Tahmini {quote.total} {currency}
              {quote.minAvail < 1 ? ' · Müsaitlik yok' : ` · ${quote.minAvail} oda müsait`}
            </p>
          ) : null}

          <label className="roomio-field roomio-field--full">
            <span>Ad Soyad</span>
            <input className="roomio-input" required value={guestName} onChange={(e) => setGuestName(e.target.value)} />
          </label>
          <label className="roomio-field">
            <span>E-posta</span>
            <input className="roomio-input" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
          </label>
          <label className="roomio-field">
            <span>Telefon</span>
            <input className="roomio-input" value={phone} onChange={(e) => setPhone(e.target.value)} />
          </label>

          <fieldset className="roomio-field roomio-field--full">
            <legend>Ödeme</legend>
            <label className="roomio-field roomio-field--row">
              <input type="radio" checked={paymentMethod === 'hotel'} onChange={() => setPaymentMethod('hotel')} />
              <span>Otelde ödeme</span>
            </label>
            <label className="roomio-field roomio-field--row">
              <input type="radio" checked={paymentMethod === 'card'} onChange={() => setPaymentMethod('card')} />
              <span><CreditCard size={14} /> Sanal POS (kart)</span>
            </label>
            {paymentMethod === 'card' ? (
              <input className="roomio-input" placeholder="Kart son 4 hane" maxLength={4} value={cardLast4} onChange={(e) => setCardLast4(e.target.value)} />
            ) : null}
            {requirePrepayment ? <p className="roomio-page-desc">Bu otel için online ön ödeme zorunludur.</p> : null}
          </fieldset>

          {error ? <p className="roomio-public-portal__error roomio-field--full">{error}</p> : null}

          <button className="roomio-btn roomio-btn--primary roomio-field--full" type="submit" disabled={loading || quote.minAvail < 1}>
            {loading ? 'İşleniyor…' : 'Rezervasyonu Tamamla'}
          </button>
        </form>
      </div>
    </div>
  );
}

export default function BookPage() {
  return (
    <Suspense fallback={<div className="roomio-public-portal"><p>Yükleniyor…</p></div>}>
      <BookingForm />
    </Suspense>
  );
}
