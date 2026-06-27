'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { Button } from '@/components/ui';
import { TableFooter } from '@/components/ReportToolbar';
import { roomioFetch } from '@/lib/client/api';
import { useReservations } from '@/lib/client/use-reservations';
import type { GuestActivity } from '@/lib/data/guest-relations';

export function GuestActivitiesPanel() {
  const { reservations } = useReservations();
  const inHouse = useMemo(
    () => reservations.filter((r) => r.status === 'CHECKED_IN' && r.roomNo),
    [reservations],
  );

  const [activities, setActivities] = useState<GuestActivity[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    reservationId: '',
    activity: '',
    description: '',
    staff: 'Misafir İlişkileri',
  });

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await roomioFetch('/api/guest-activities');
      const j = (await res.json()) as { activities?: GuestActivity[] };
      setActivities(j.activities ?? []);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const selected = inHouse.find((r) => r.id === form.reservationId);

  async function save(e: React.FormEvent) {
    e.preventDefault();
    if (!selected || !form.activity.trim()) return;
    const extra = (selected as { extraData?: Record<string, string> }).extraData;
    await roomioFetch('/api/guest-activities', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        guestName: selected.guestName,
        roomNo: selected.roomNo,
        nationality: extra?.nationality ?? '—',
        activity: form.activity,
        description: form.description || form.activity,
        staff: form.staff,
        reservationId: selected.id,
      }),
    });
    setShowForm(false);
    setForm({ reservationId: '', activity: '', description: '', staff: 'Misafir İlişkileri' });
    await load();
  }

  return (
    <>
      <div style={{ marginBottom: 12 }}><Button onClick={() => setShowForm((v) => !v)}>{showForm ? 'İptal' : '+ Aktivite'}</Button></div>
      {showForm ? (
        <form className="roomio-card roomio-form" onSubmit={(e) => void save(e)} style={{ marginBottom: 16 }}>
          <div className="roomio-form-grid">
            <label className="roomio-field roomio-field--full">
              <span>Misafir</span>
              <select className="roomio-select" value={form.reservationId} onChange={(e) => setForm((p) => ({ ...p, reservationId: e.target.value }))}>
                <option value="">Seçin…</option>
                {inHouse.map((r) => <option key={r.id} value={r.id}>{r.roomNo} — {r.guestName}</option>)}
              </select>
            </label>
            <label className="roomio-field"><span>Aktivite</span><input className="roomio-input" value={form.activity} onChange={(e) => setForm((p) => ({ ...p, activity: e.target.value }))} placeholder="VIP, Doğum günü…" /></label>
            <label className="roomio-field"><span>Personel</span><input className="roomio-input" value={form.staff} onChange={(e) => setForm((p) => ({ ...p, staff: e.target.value }))} /></label>
            <label className="roomio-field roomio-field--full"><span>Açıklama</span><input className="roomio-input" value={form.description} onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))} /></label>
          </div>
          <div className="roomio-form-actions"><Button type="submit">Kaydet</Button></div>
        </form>
      ) : null}
      <div className="roomio-card roomio-table-wrap">
        <table className="roomio-table">
          <thead><tr><th>Tarih/Saat</th><th>Misafir</th><th>Oda</th><th>Uyruk</th><th>Aktivite</th><th>Açıklama</th><th>Personel</th></tr></thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={7}>Yükleniyor…</td></tr>
            ) : activities.length === 0 ? (
              <tr><td colSpan={7}>Kayıt yok.</td></tr>
            ) : (
              activities.map((r) => (
                <tr key={r.id}>
                  <td>{r.datetime}</td>
                  <td><strong>{r.guestName}</strong></td>
                  <td>{r.roomNo}</td>
                  <td>{r.nationality}</td>
                  <td>{r.activity}</td>
                  <td>{r.description}</td>
                  <td>{r.staff}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
        <TableFooter total={activities.length} />
      </div>
    </>
  );
}
