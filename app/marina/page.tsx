'use client';

import { useEffect, useState, type FormEvent } from 'react';
import Link from 'next/link';
import { Anchor } from 'lucide-react';
import type { MarinaBerth } from '@/lib/integrations/marina/types';

type Catalog = {
  ok: boolean;
  marinaName: string;
  allowOnlineBooking: boolean;
  checkInTime: string;
  checkOutTime: string;
  berths: MarinaBerth[];
};

export default function MarinaPage() {
  const [catalog, setCatalog] = useState<Catalog | null>(null);
  const [selected, setSelected] = useState('');
  const [vesselName, setVesselName] = useState('');
  const [captain, setCaptain] = useState('');
  const [lengthM, setLengthM] = useState('12');
  const [arrival, setArrival] = useState('');
  const [departure, setDeparture] = useState('');
  const [msg, setMsg] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const start = new Date();
    start.setDate(start.getDate() + 2);
    const end = new Date(start);
    end.setDate(end.getDate() + 3);
    setArrival(start.toISOString().slice(0, 10));
    setDeparture(end.toISOString().slice(0, 10));
    void fetch('/api/integrations/marina/catalog')
      .then((r) => r.json())
      .then((j: Catalog) => {
        if (!j.ok) setError('Marina şu an kapalı');
        else setCatalog(j);
      })
      .catch(() => setError('Marina kataloğu yüklenemedi'));
  }, []);

  async function book(e: FormEvent) {
    e.preventDefault();
    if (!selected) return;
    setMsg(null);
    setError(null);
    const res = await fetch('/api/integrations/marina/bookings', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ berthId: selected, vesselName, captain, lengthM: Number(lengthM), arrival, departure }),
    });
    const j = (await res.json()) as { ok: boolean; message: string };
    if (!j.ok) setError(j.message);
    else setMsg(j.message);
  }

  return (
    <div className="roomio-public-portal">
      <div className="roomio-public-portal__card roomio-public-portal__card--wide">
        <div className="roomio-public-portal__brand">
          <Anchor size={28} />
          <div>
            <strong>{catalog?.marinaName ?? 'Marina'}</strong>
            <span>Rıhtım rezervasyonu</span>
          </div>
        </div>

        {catalog?.berths?.length ? (
          <div className="roomio-public-portal__stack" style={{ marginTop: 16 }}>
            {catalog.berths.map((b) => (
              <label key={b.id} className="roomio-card" style={{ display: 'flex', gap: 12, alignItems: 'center', cursor: 'pointer' }}>
                <input type="radio" name="berth" value={b.id} checked={selected === b.id} onChange={() => setSelected(b.id)} />
                <div style={{ flex: 1 }}>
                  <strong>{b.name}</strong>
                  <p className="roomio-page-desc">{b.lengthM}m × {b.widthM}m · derinlik {b.depthM}m{b.powerHookup ? ' · elektrik' : ''}</p>
                </div>
                <strong>{b.dailyRate} {b.currency}/gün</strong>
              </label>
            ))}
          </div>
        ) : !error ? <p>Yükleniyor…</p> : null}

        {catalog?.allowOnlineBooking ? (
          <form className="roomio-public-portal__stack" style={{ marginTop: 20 }} onSubmit={(e) => void book(e)}>
            <label className="roomio-field"><span>Tekne adı</span><input className="roomio-input" value={vesselName} onChange={(e) => setVesselName(e.target.value)} required /></label>
            <label className="roomio-field"><span>Kaptan</span><input className="roomio-input" value={captain} onChange={(e) => setCaptain(e.target.value)} required /></label>
            <label className="roomio-field"><span>Tekne uzunluğu (m)</span><input className="roomio-input" type="number" value={lengthM} onChange={(e) => setLengthM(e.target.value)} required /></label>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <label className="roomio-field"><span>Giriş</span><input className="roomio-input" type="date" value={arrival} onChange={(e) => setArrival(e.target.value)} required /></label>
              <label className="roomio-field"><span>Çıkış</span><input className="roomio-input" type="date" value={departure} onChange={(e) => setDeparture(e.target.value)} required /></label>
            </div>
            <button className="roomio-btn roomio-btn--primary" type="submit" disabled={!selected}>Rıhtım Rezerve Et</button>
          </form>
        ) : null}

        {error ? <p className="roomio-public-portal__error">{error}</p> : null}
        {msg ? <p className="roomio-public-portal__success-inline">{msg}</p> : null}
        <p className="roomio-page-desc" style={{ marginTop: 16 }}>
          Check-in {catalog?.checkInTime ?? '14:00'} · Check-out {catalog?.checkOutTime ?? '12:00'}
        </p>
      </div>
    </div>
  );
}
