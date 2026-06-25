'use client';

import { useEffect, useState, type FormEvent } from 'react';
import Link from 'next/link';
import { Dumbbell } from 'lucide-react';
import type { GymClass } from '@/lib/integrations/gym/types';

type GymCatalog = {
  ok: boolean;
  gymName: string;
  openFrom: string;
  openTo: string;
  allowOnlineBooking: boolean;
  classes: GymClass[];
};

export default function GymPage() {
  const [catalog, setCatalog] = useState<GymCatalog | null>(null);
  const [selected, setSelected] = useState('');
  const [guest, setGuest] = useState('');
  const [roomNo, setRoomNo] = useState('');
  const [date, setDate] = useState('');
  const [msg, setMsg] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    setDate(tomorrow.toISOString().slice(0, 10));
    void fetch('/api/integrations/gym/catalog')
      .then((r) => r.json())
      .then((j: GymCatalog) => {
        if (!j.ok) setError('Spor salonu şu an kapalı');
        else setCatalog(j);
      })
      .catch(() => setError('Spor salonu kataloğu yüklenemedi'));
  }, []);

  async function book(e: FormEvent) {
    e.preventDefault();
    if (!selected) return;
    setMsg(null);
    setError(null);
    const res = await fetch('/api/integrations/gym/book', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ classId: selected, guest, roomNo, date }),
    });
    const j = (await res.json()) as { ok: boolean; message: string };
    if (!j.ok) setError(j.message);
    else setMsg(j.message);
  }

  return (
    <div className="roomio-public-portal">
      <div className="roomio-public-portal__card roomio-public-portal__card--wide">
        <div className="roomio-public-portal__brand">
          <Dumbbell size={28} />
          <div>
            <strong>{catalog?.gymName ?? 'Fitness'}</strong>
            <span>
              {catalog ? `${catalog.openFrom} – ${catalog.openTo}` : 'Spor dersleri'}
            </span>
          </div>
        </div>

        {catalog?.classes?.length ? (
          <div className="roomio-public-portal__stack" style={{ marginTop: 16 }}>
            {catalog.classes.map((c) => (
              <label key={c.id} className="roomio-card" style={{ display: 'flex', gap: 12, alignItems: 'center', cursor: 'pointer' }}>
                <input type="radio" name="class" value={c.id} checked={selected === c.id} onChange={() => setSelected(c.id)} />
                <div style={{ flex: 1 }}>
                  <strong>{c.name}</strong>
                  <p className="roomio-page-desc">
                    {c.instructor} · {c.durationMinutes} dk · {c.schedule}
                  </p>
                </div>
                <strong>max {c.maxParticipants}</strong>
              </label>
            ))}
          </div>
        ) : !error ? <p>Yükleniyor…</p> : null}

        {catalog?.allowOnlineBooking ? (
          <form className="roomio-public-portal__stack" style={{ marginTop: 20 }} onSubmit={(e) => void book(e)}>
            <label className="roomio-field">
              <span>Misafir adı</span>
              <input className="roomio-input" value={guest} onChange={(e) => setGuest(e.target.value)} required />
            </label>
            <label className="roomio-field">
              <span>Oda no</span>
              <input className="roomio-input" value={roomNo} onChange={(e) => setRoomNo(e.target.value)} required />
            </label>
            <label className="roomio-field">
              <span>Tarih</span>
              <input className="roomio-input" type="date" value={date} onChange={(e) => setDate(e.target.value)} required />
            </label>
            <button className="roomio-btn roomio-btn--primary" type="submit" disabled={!selected}>
              Ders Rezerve Et
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
