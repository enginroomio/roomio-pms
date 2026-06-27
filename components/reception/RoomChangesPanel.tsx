'use client';

import Link from 'next/link';
import { useMemo, useState } from 'react';
import { Button } from '@/components/ui';
import { roomioFetch } from '@/lib/client/api';
import { parseApiError } from '@/lib/client/api-errors';
import { useReservations } from '@/lib/client/use-reservations';
import { getInHouseGuests } from '@/lib/data/reception';
import { pickPlannedRoomChanges } from '@/lib/reception/room-changes';
import type { Reservation } from '@/lib/types/reservation';

export function RoomChangesPanel() {
  const { reservations, reload } = useReservations();
  const inhouse = useMemo(() => getInHouseGuests(reservations), [reservations]);
  const planned = useMemo(() => pickPlannedRoomChanges(reservations), [reservations]);
  const today = new Date().toISOString().slice(0, 10);
  const [resId, setResId] = useState('');
  const [toRoom, setToRoom] = useState('');
  const [changeDate, setChangeDate] = useState(today);
  const [notes, setNotes] = useState('');
  const [msg, setMsg] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function savePlan() {
    const res = reservations.find((r) => r.id === resId);
    if (!res || !toRoom.trim() || !changeDate) {
      setMsg('Misafir, yeni oda ve tarih gerekli');
      return;
    }
    setBusy(true);
    setMsg(null);
    try {
      const extraData = {
        ...(res.extraData ?? {}),
        plannedRoomNo: toRoom.trim(),
        roomChangeDate: changeDate,
        ...(notes.trim() ? { roomChangeNotes: notes.trim() } : {}),
      };
      const r = await roomioFetch('/api/reservations', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: res.id, extraData }),
      });
      if (!r.ok) throw new Error(await parseApiError(r, 'Plan kaydedilemedi'));
      setResId('');
      setToRoom('');
      setNotes('');
      setMsg('Oda değişimi planlandı.');
      await reload();
    } catch (err) {
      setMsg(err instanceof Error ? err.message : 'Plan kaydedilemedi');
    } finally {
      setBusy(false);
    }
  }

  async function applyChange(row: ReturnType<typeof pickPlannedRoomChanges>[number]) {
    setBusy(true);
    setMsg(null);
    try {
      const extraData = { ...(row.reservation.extraData ?? {}) };
      delete extraData.plannedRoomNo;
      delete extraData.newRoomNo;
      delete extraData.roomChangeDate;
      delete extraData.roomChangeNotes;
      const r = await roomioFetch('/api/reservations', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: row.reservation.id,
          roomNo: row.toRoom,
          extraData,
        }),
      });
      if (!r.ok) throw new Error(await parseApiError(r, 'Oda değişimi uygulanamadı'));
      setMsg(`${row.guestName} → oda ${row.toRoom}`);
      await reload();
    } catch (err) {
      setMsg(err instanceof Error ? err.message : 'Oda değişimi uygulanamadı');
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="roomio-detail-grid" style={{ marginTop: 16 }}>
      <div className="roomio-card" style={{ padding: 20 }}>
        <h2 className="roomio-card-title">Yeni oda değişimi planla</h2>
        <div className="roomio-form-grid" style={{ marginTop: 12 }}>
          <label className="roomio-field">
            <span>Konaklayan</span>
            <select className="roomio-input" value={resId} onChange={(e) => setResId(e.target.value)}>
              <option value="">Seçin…</option>
              {inhouse.map((g) => (
                <option key={g.id} value={g.id}>{g.roomNo} — {g.guestName}</option>
              ))}
            </select>
          </label>
          <label className="roomio-field">
            <span>Yeni oda</span>
            <input className="roomio-input" value={toRoom} onChange={(e) => setToRoom(e.target.value)} placeholder="ör. 412" />
          </label>
          <label className="roomio-field">
            <span>Tarih</span>
            <input className="roomio-input" type="date" value={changeDate} onChange={(e) => setChangeDate(e.target.value)} />
          </label>
          <label className="roomio-field">
            <span>Not</span>
            <input className="roomio-input" value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Opsiyonel" />
          </label>
        </div>
        <div className="roomio-form-actions" style={{ marginTop: 12 }}>
          <Button disabled={busy} onClick={() => void savePlan()}>Planla</Button>
        </div>
        {msg ? <p className="roomio-page-desc" role="status" style={{ marginTop: 8 }}>{msg}</p> : null}
      </div>

      <div className="roomio-card roomio-table-wrap">
        <div className="roomio-kurulus-toolbar">
          <h2 className="roomio-card-title">Planlanan değişimler</h2>
          <Button variant="secondary" href="/reports?report=room-changes">Tam liste</Button>
        </div>
        <table className="roomio-table" style={{ marginTop: 12 }}>
          <thead>
            <tr><th>Misafir</th><th>Eski oda</th><th>Yeni oda</th><th>Tarih</th><th>Not</th><th /></tr>
          </thead>
          <tbody>
            {planned.length === 0 ? (
              <tr><td colSpan={6} className="roomio-table-empty">Planlanan oda değişimi yok.</td></tr>
            ) : planned.map((row) => (
              <tr key={row.reservation.id}>
                <td>{row.guestName}</td>
                <td>{row.fromRoom}</td>
                <td><strong>{row.toRoom}</strong></td>
                <td>{row.changeDate}</td>
                <td>{row.notes || '—'}</td>
                <td style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                  {row.changeDate <= today ? (
                    <Button variant="secondary" disabled={busy} onClick={() => void applyChange(row)}>Uygula</Button>
                  ) : null}
                  <Button variant="ghost" href={`/reception/guest/${row.reservation.id}`}>Folyo</Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export function RoomChangesReportPanel({ reservations }: { reservations: Reservation[] }) {
  const planned = useMemo(() => pickPlannedRoomChanges(reservations), [reservations]);
  const today = new Date().toISOString().slice(0, 10);
  const dueToday = planned.filter((r) => r.changeDate === today);

  return (
    <div className="roomio-transfer-report">
      <div className="roomio-card">
        <h2 className="roomio-card-title">Oda Değişim Listesi</h2>
        <p className="roomio-page-desc" style={{ marginTop: 8 }}>
          Rezervasyon ek bilgilerindeki planlanan oda numarası ve değişim tarihi alanları.
        </p>
        <div className="roomio-kpi-strip" style={{ marginTop: 12 }}>
          <span className="roomio-badge">{planned.length} planlı değişim</span>
          <span className="roomio-badge">Bugün: {dueToday.length}</span>
        </div>
        <div className="roomio-form-actions" style={{ marginTop: 12 }}>
          <Button variant="secondary" href="/reception/inhouse?tab=room-changes">Planlama ekranı</Button>
          <Button variant="ghost" href="/reception/inhouse">← Konaklayanlar</Button>
        </div>
      </div>

      <div className="roomio-card roomio-table-wrap" style={{ marginTop: 12 }}>
        <table className="roomio-table">
          <thead>
            <tr>
              <th>Rez. no</th>
              <th>Misafir</th>
              <th>Eski oda</th>
              <th>Yeni oda</th>
              <th>Tarih</th>
              <th>Not</th>
              <th>Durum</th>
            </tr>
          </thead>
          <tbody>
            {planned.length === 0 ? (
              <tr>
                <td colSpan={7} className="roomio-table-empty">
                  Kayıt yok. <Link href="/reception/inhouse?tab=room-changes" className="roomio-link">Planlanan Oda Değişimleri</Link> ekranından ekleyin.
                </td>
              </tr>
            ) : planned.map((row) => (
              <tr key={row.reservation.id}>
                <td>
                  <Link href={`/reservations/${row.reservation.id}/edit`} className="roomio-link">
                    {row.reservation.refNo}
                  </Link>
                </td>
                <td>{row.guestName}</td>
                <td>{row.fromRoom}</td>
                <td><strong>{row.toRoom}</strong></td>
                <td>{row.changeDate}</td>
                <td>{row.notes || '—'}</td>
                <td>{row.reservation.status}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
