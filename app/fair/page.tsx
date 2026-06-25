'use client';

import { useEffect, useState, type FormEvent } from 'react';
import Link from 'next/link';
import { Ticket } from 'lucide-react';
import type { FairEvent } from '@/lib/integrations/fair-events/types';

type FairCatalog = {
  ok: boolean;
  organizerName: string;
  allowOnlineRegistration: boolean;
  events: FairEvent[];
};

export default function FairPage() {
  const [catalog, setCatalog] = useState<FairCatalog | null>(null);
  const [selected, setSelected] = useState('');
  const [name, setName] = useState('');
  const [company, setCompany] = useState('');
  const [email, setEmail] = useState('');
  const [msg, setMsg] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    void fetch('/api/integrations/fair-events/catalog')
      .then((r) => r.json())
      .then((j: FairCatalog) => {
        if (!j.ok) setError('Fuar kayıtları şu an kapalı');
        else setCatalog(j);
      })
      .catch(() => setError('Fuar kataloğu yüklenemedi'));
  }, []);

  async function register(e: FormEvent) {
    e.preventDefault();
    if (!selected) return;
    setMsg(null);
    setError(null);
    const res = await fetch('/api/integrations/fair-events/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ eventId: selected, name, company, email }),
    });
    const j = (await res.json()) as { ok: boolean; message: string };
    if (!j.ok) setError(j.message);
    else setMsg(j.message);
  }

  return (
    <div className="roomio-public-portal">
      <div className="roomio-public-portal__card roomio-public-portal__card--wide">
        <div className="roomio-public-portal__brand">
          <Ticket size={28} />
          <div>
            <strong>{catalog?.organizerName ?? 'Fuar & Etkinlik'}</strong>
            <span>Online kayıt</span>
          </div>
        </div>

        {catalog?.events?.length ? (
          <div className="roomio-public-portal__stack" style={{ marginTop: 16 }}>
            {catalog.events.map((ev) => (
              <label key={ev.id} className="roomio-card" style={{ display: 'flex', gap: 12, alignItems: 'center', cursor: 'pointer' }}>
                <input type="radio" name="event" value={ev.id} checked={selected === ev.id} onChange={() => setSelected(ev.id)} />
                <div style={{ flex: 1 }}>
                  <strong>{ev.name}</strong>
                  <p className="roomio-page-desc">
                    {ev.venue} · {ev.startDate}
                    {ev.endDate !== ev.startDate ? ` – ${ev.endDate}` : ''}
                  </p>
                </div>
                <strong>{ev.registered}/{ev.capacity}</strong>
              </label>
            ))}
          </div>
        ) : !error ? <p>Yükleniyor…</p> : null}

        {catalog?.allowOnlineRegistration ? (
          <form className="roomio-public-portal__stack" style={{ marginTop: 20 }} onSubmit={(e) => void register(e)}>
            <label className="roomio-field">
              <span>Ad soyad</span>
              <input className="roomio-input" value={name} onChange={(e) => setName(e.target.value)} required />
            </label>
            <label className="roomio-field">
              <span>Şirket</span>
              <input className="roomio-input" value={company} onChange={(e) => setCompany(e.target.value)} required />
            </label>
            <label className="roomio-field">
              <span>E-posta</span>
              <input className="roomio-input" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
            </label>
            <button className="roomio-btn roomio-btn--primary" type="submit" disabled={!selected}>
              Kayıt Ol
            </button>
          </form>
        ) : null}

        {error ? <p className="roomio-public-portal__error">{error}</p> : null}
        {msg ? <p className="roomio-public-portal__success-inline">{msg}</p> : null}

        <p className="roomio-page-desc" style={{ marginTop: 16 }}>
          <Link href="/guest">Misafir portalı</Link>
        </p>
      </div>
    </div>
  );
}
