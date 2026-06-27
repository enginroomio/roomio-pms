'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { Button } from '@/components/ui';
import { useI18n } from '@/components/i18n/I18nProvider';
import { roomioFetch } from '@/lib/client/api';
import { useReservations } from '@/lib/client/use-reservations';
import { formatMoney } from '@/lib/data/cash';
import { BANKET_HALLS } from '@/lib/data/banket';
import type { BanketReservation } from '@/lib/data/banket';

export function BanketEventsPanel() {
  const { t } = useI18n();
  const { reservations } = useReservations();
  const inHouse = useMemo(
    () => reservations.filter((r) => r.status === 'CHECKED_IN' && r.roomNo),
    [reservations],
  );

  const [events, setEvents] = useState<BanketReservation[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [folioTarget, setFolioTarget] = useState<Record<string, string>>({});
  const [msg, setMsg] = useState<string | null>(null);
  const [form, setForm] = useState({
    eventName: '',
    hall: BANKET_HALLS[0] as string,
    date: '',
    startTime: '19:00',
    endTime: '23:00',
    pax: '50',
    contact: '',
    revenue: '',
  });

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await roomioFetch('/api/fnb/banket');
      const j = (await res.json()) as { events?: BanketReservation[] };
      setEvents(j.events ?? []);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  async function save(e: React.FormEvent) {
    e.preventDefault();
    await roomioFetch('/api/fnb/banket', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        eventName: form.eventName,
        hall: form.hall,
        date: form.date || undefined,
        startTime: form.startTime,
        endTime: form.endTime,
        pax: Number(form.pax),
        contact: form.contact,
        revenue: Number(form.revenue.replace(',', '.')) || 0,
        status: 'option',
      }),
    });
    setShowForm(false);
    await load();
  }

  async function confirmEvent(id: string) {
    await roomioFetch('/api/fnb/banket', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'confirm', id }),
    });
    await load();
  }

  async function postToFolio(event: BanketReservation) {
    const reservationId = folioTarget[event.id];
    if (!reservationId) {
      setMsg(t('fnb.banket.selectRoom'));
      return;
    }
    setMsg(null);
    const res = await roomioFetch('/api/fnb/banket', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'postFolio', id: event.id, reservationId }),
    });
    const j = (await res.json()) as { ok?: boolean; error?: string; event?: BanketReservation };
    if (!res.ok || !j.ok) {
      setMsg(j.error ?? t('fnb.banket.folioFail'));
      return;
    }
    setMsg(t('fnb.banket.folioOk', { amount: formatMoney(event.revenue) }));
  }

  const confirmed = events.filter((b) => b.status === 'confirmed').length;

  return (
    <>
      <div className="roomio-kpi-grid" style={{ marginTop: 16 }}>
        <div className="roomio-kpi"><span className="roomio-kpi-label">{t('fnb.banket.halls')}</span><strong className="roomio-kpi-value">{BANKET_HALLS.length}</strong></div>
        <div className="roomio-kpi"><span className="roomio-kpi-label">{t('fnb.banket.events')}</span><strong className="roomio-kpi-value">{events.length}</strong></div>
        <div className="roomio-kpi"><span className="roomio-kpi-label">{t('fnb.banket.confirmed')}</span><strong className="roomio-kpi-value">{confirmed}</strong></div>
      </div>
      {msg ? <p className="roomio-page-desc" style={{ marginTop: 12 }}>{msg}</p> : null}
      <div className="roomio-card roomio-table-wrap" style={{ marginTop: 16 }}>
        <div className="roomio-kurulus-toolbar">
          <h2 className="roomio-card-title">{t('fnb.banket.title')}</h2>
          <Button onClick={() => setShowForm((v) => !v)}>{showForm ? t('gr.complaints.cancel') : t('fnb.banket.add')}</Button>
        </div>
        {showForm ? (
          <form className="roomio-form" onSubmit={(e) => void save(e)} style={{ marginTop: 12 }}>
            <div className="roomio-form-grid">
              <label className="roomio-field roomio-field--full"><span>{t('fnb.banket.event')}</span><input className="roomio-input" value={form.eventName} onChange={(e) => setForm((p) => ({ ...p, eventName: e.target.value }))} required /></label>
              <label className="roomio-field"><span>{t('fnb.banket.hall')}</span>
                <select className="roomio-select" value={form.hall} onChange={(e) => setForm((p) => ({ ...p, hall: e.target.value }))}>
                  {BANKET_HALLS.map((h) => <option key={h} value={h}>{h}</option>)}
                </select>
              </label>
              <label className="roomio-field"><span>{t('gr.complaints.col.date')}</span><input className="roomio-input" type="date" value={form.date} onChange={(e) => setForm((p) => ({ ...p, date: e.target.value }))} /></label>
              <label className="roomio-field"><span>{t('fnb.banket.start')}</span><input className="roomio-input" value={form.startTime} onChange={(e) => setForm((p) => ({ ...p, startTime: e.target.value }))} /></label>
              <label className="roomio-field"><span>{t('fnb.banket.end')}</span><input className="roomio-input" value={form.endTime} onChange={(e) => setForm((p) => ({ ...p, endTime: e.target.value }))} /></label>
              <label className="roomio-field"><span>{t('fnb.banket.pax')}</span><input className="roomio-input" value={form.pax} onChange={(e) => setForm((p) => ({ ...p, pax: e.target.value }))} /></label>
              <label className="roomio-field"><span>{t('fnb.banket.contact')}</span><input className="roomio-input" value={form.contact} onChange={(e) => setForm((p) => ({ ...p, contact: e.target.value }))} required /></label>
              <label className="roomio-field"><span>{t('fnb.banket.revenue')}</span><input className="roomio-input" value={form.revenue} onChange={(e) => setForm((p) => ({ ...p, revenue: e.target.value }))} /></label>
            </div>
            <div className="roomio-form-actions"><Button type="submit">{t('gr.complaints.save')}</Button></div>
          </form>
        ) : null}
        <table className="roomio-table" style={{ marginTop: 12 }}>
          <thead>
            <tr>
              <th>{t('fnb.banket.event')}</th>
              <th>{t('fnb.banket.hall')}</th>
              <th>{t('gr.complaints.col.date')}</th>
              <th>{t('fnb.banket.time')}</th>
              <th>{t('fnb.banket.pax')}</th>
              <th>{t('fnb.banket.contact')}</th>
              <th>{t('fnb.banket.revenue')}</th>
              <th>{t('gr.complaints.col.status')}</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={9}>{t('reception.loading')}</td></tr>
            ) : events.length === 0 ? (
              <tr><td colSpan={9}>{t('fnb.banket.empty')}</td></tr>
            ) : (
              events.map((b) => (
                <tr key={b.id}>
                  <td><strong>{b.eventName}</strong></td>
                  <td>{b.hall}</td>
                  <td>{b.date}</td>
                  <td>{b.startTime}–{b.endTime}</td>
                  <td>{b.pax}</td>
                  <td>{b.contact}</td>
                  <td>{formatMoney(b.revenue)}</td>
                  <td><span className="roomio-badge">{b.status === 'confirmed' ? t('fnb.banket.statusConfirmed') : b.status === 'option' ? t('fnb.banket.statusOption') : t('fnb.banket.statusCancelled')}</span></td>
                  <td>
                    {b.status !== 'confirmed' ? (
                      <>
                        <Button variant="secondary" onClick={() => void confirmEvent(b.id)}>{t('fnb.banket.confirm')}</Button>
                        {' '}
                      </>
                    ) : null}
                    {b.revenue > 0 ? (
                      <>
                        <select
                          className="roomio-select"
                          style={{ maxWidth: 140, marginRight: 4 }}
                          value={folioTarget[b.id] ?? ''}
                          onChange={(e) => setFolioTarget((prev) => ({ ...prev, [b.id]: e.target.value }))}
                        >
                          <option value="">{t('fnb.banket.room')}</option>
                          {inHouse.map((r) => (
                            <option key={r.id} value={r.id}>{r.roomNo}</option>
                          ))}
                        </select>
                        <Button variant="ghost" onClick={() => void postToFolio(b)}>{t('fnb.banket.postFolio')}</Button>
                      </>
                    ) : null}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </>
  );
}
