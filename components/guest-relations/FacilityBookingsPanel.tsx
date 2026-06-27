'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { Button } from '@/components/ui';
import { TableFooter } from '@/components/ReportToolbar';
import { roomioFetch } from '@/lib/client/api';
import { useReservations } from '@/lib/client/use-reservations';
import type { FacilityBooking } from '@/lib/data/guest-relations';

type FacilityKind = 'restaurant' | 'tennis';

type Props = {
  kind: FacilityKind;
  title: string;
};

export function FacilityBookingsPanel({ kind, title }: Props) {
  const { reservations } = useReservations();
  const inHouse = useMemo(
    () => reservations.filter((r) => r.status === 'CHECKED_IN' && r.roomNo),
    [reservations],
  );

  const [bookings, setBookings] = useState<FacilityBooking[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [reservationId, setReservationId] = useState('');
  const [date, setDate] = useState('');
  const [time, setTime] = useState(kind === 'restaurant' ? '20:00' : '17:00');
  const [party, setParty] = useState('2');
  const [notes, setNotes] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await roomioFetch(`/api/facility-bookings?kind=${kind}`);
      const j = (await res.json()) as { bookings?: FacilityBooking[] };
      setBookings(j.bookings ?? []);
    } finally {
      setLoading(false);
    }
  }, [kind]);

  useEffect(() => {
    void load();
  }, [load]);

  const selected = inHouse.find((r) => r.id === reservationId);

  async function save(e: React.FormEvent) {
    e.preventDefault();
    if (!selected) return;
    await roomioFetch('/api/facility-bookings', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        kind,
        guest: selected.guestName,
        roomNo: selected.roomNo,
        reservationId: selected.id,
        date: date || undefined,
        time,
        party: Number(party),
        notes: notes || undefined,
      }),
    });
    setShowForm(false);
    await load();
  }

  return (
    <>
      <div style={{ marginBottom: 12 }}>
        <Button onClick={() => setShowForm((v) => !v)}>{showForm ? 'İptal' : '+ Rezervasyon'}</Button>
      </div>
      {showForm ? (
        <form className="roomio-card roomio-form" onSubmit={(e) => void save(e)} style={{ marginBottom: 16 }}>
          <h3 className="roomio-card-title">{title} — yeni</h3>
          <div className="roomio-form-grid">
            <label className="roomio-field roomio-field--full">
              <span>Misafir</span>
              <select className="roomio-select" value={reservationId} onChange={(e) => setReservationId(e.target.value)}>
                <option value="">Seçin…</option>
                {inHouse.map((r) => (
                  <option key={r.id} value={r.id}>{r.roomNo} — {r.guestName}</option>
                ))}
              </select>
            </label>
            <label className="roomio-field"><span>Tarih</span><input className="roomio-input" type="date" value={date} onChange={(e) => setDate(e.target.value)} /></label>
            <label className="roomio-field"><span>Saat</span><input className="roomio-input" value={time} onChange={(e) => setTime(e.target.value)} /></label>
            <label className="roomio-field"><span>Kişi</span><input className="roomio-input" value={party} onChange={(e) => setParty(e.target.value)} /></label>
            {kind === 'restaurant' ? (
              <label className="roomio-field roomio-field--full"><span>Not</span><input className="roomio-input" value={notes} onChange={(e) => setNotes(e.target.value)} /></label>
            ) : null}
          </div>
          <div className="roomio-form-actions"><Button type="submit">Kaydet</Button></div>
        </form>
      ) : null}
      <div className="roomio-card roomio-table-wrap">
        <table className="roomio-table">
          <thead>
            <tr>
              <th>Tarih</th><th>Saat</th><th>Misafir</th><th>Oda</th><th>Kişi</th><th>Durum</th>
              {kind === 'restaurant' ? <th>Not</th> : null}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={kind === 'restaurant' ? 7 : 6}>Yükleniyor…</td></tr>
            ) : bookings.length === 0 ? (
              <tr><td colSpan={kind === 'restaurant' ? 7 : 6}>Rezervasyon yok.</td></tr>
            ) : (
              bookings.map((r) => (
                <tr key={r.id}>
                  <td>{r.date}</td>
                  <td>{r.time}</td>
                  <td>{r.guest}</td>
                  <td>{r.roomNo}</td>
                  <td>{r.party}</td>
                  <td>{r.status}</td>
                  {kind === 'restaurant' ? <td>{r.notes ?? '—'}</td> : null}
                </tr>
              ))
            )}
          </tbody>
        </table>
        <TableFooter total={bookings.length} />
      </div>
    </>
  );
}
