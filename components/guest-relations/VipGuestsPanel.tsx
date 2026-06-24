'use client';

import { useCallback, useEffect, useState } from 'react';
import { VipBadge } from '@/components/StarRating';
import { Button } from '@/components/ui';
import { TableFooter } from '@/components/ReportToolbar';
import { useI18n } from '@/components/i18n/I18nProvider';
import { roomioFetch } from '@/lib/client/api';
import type { VipGuest } from '@/lib/data/guest-relations';

const LEVELS = ['Platinum', 'Gold', 'Silver', 'Bronze'] as const;

export function VipGuestsPanel() {
  const { t } = useI18n();
  const [level, setLevel] = useState('Tümü');
  const [guests, setGuests] = useState<VipGuest[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    level: 'Gold' as (typeof LEVELS)[number],
    guestName: '',
    country: 'TR',
    room: '',
    arrival: new Date().toISOString().slice(0, 10),
    departure: '',
    nights: 1,
  });

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params = level !== 'Tümü' ? `?level=${encodeURIComponent(level)}` : '';
      const res = await roomioFetch(`/api/vip-guests${params}`);
      const j = (await res.json()) as { guests?: VipGuest[] };
      setGuests(j.guests ?? []);
    } finally {
      setLoading(false);
    }
  }, [level]);

  useEffect(() => {
    void load();
  }, [load]);

  async function save(e: React.FormEvent) {
    e.preventDefault();
    await roomioFetch('/api/vip-guests', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...form,
        status: 'Konaklayacak',
      }),
    });
    setShowForm(false);
    setForm({
      level: 'Gold',
      guestName: '',
      country: 'TR',
      room: '',
      arrival: new Date().toISOString().slice(0, 10),
      departure: '',
      nights: 1,
    });
    await load();
  }

  async function remove(id: string) {
    await roomioFetch(`/api/vip-guests?id=${encodeURIComponent(id)}`, { method: 'DELETE' });
    await load();
  }

  return (
    <>
      <div className="roomio-card roomio-filter-panel">
        <div className="roomio-form-grid">
          <label className="roomio-field">
            <span>{t('gr.vip.level')}</span>
            <select className="roomio-select" value={level} onChange={(e) => setLevel(e.target.value)}>
              <option>{t('gr.vip.all')}</option>
              {LEVELS.map((lv) => (
                <option key={lv} value={lv}>{lv}</option>
              ))}
            </select>
          </label>
        </div>
        <div className="roomio-form-actions" style={{ marginTop: 12 }}>
          <Button variant="secondary" onClick={() => void load()}>{t('gr.vip.refresh')}</Button>
          <Button onClick={() => setShowForm((v) => !v)}>{showForm ? t('gr.complaints.cancel') : t('gr.vip.add')}</Button>
        </div>
      </div>

      {showForm ? (
        <form className="roomio-card roomio-form" onSubmit={(e) => void save(e)} style={{ marginTop: 16 }}>
          <div className="roomio-form-grid">
            <label className="roomio-field">
              <span>{t('gr.vip.col.level')}</span>
              <select className="roomio-select" value={form.level} onChange={(e) => setForm((p) => ({ ...p, level: e.target.value as (typeof LEVELS)[number] }))}>
                {LEVELS.map((lv) => (
                  <option key={lv} value={lv}>{lv}</option>
                ))}
              </select>
            </label>
            <label className="roomio-field"><span>{t('gr.vip.col.name')}</span><input className="roomio-input" value={form.guestName} onChange={(e) => setForm((p) => ({ ...p, guestName: e.target.value }))} required /></label>
            <label className="roomio-field"><span>{t('gr.vip.col.room')}</span><input className="roomio-input" value={form.room} onChange={(e) => setForm((p) => ({ ...p, room: e.target.value }))} required /></label>
            <label className="roomio-field"><span>{t('gr.vip.col.country')}</span><input className="roomio-input" value={form.country} onChange={(e) => setForm((p) => ({ ...p, country: e.target.value }))} /></label>
            <label className="roomio-field"><span>{t('gr.vip.col.arrival')}</span><input className="roomio-input" type="date" value={form.arrival} onChange={(e) => setForm((p) => ({ ...p, arrival: e.target.value }))} /></label>
            <label className="roomio-field"><span>{t('gr.vip.nights', { count: form.nights })}</span><input className="roomio-input" type="number" min="1" value={form.nights} onChange={(e) => setForm((p) => ({ ...p, nights: Number(e.target.value) }))} /></label>
          </div>
          <div className="roomio-form-actions"><Button type="submit">{t('gr.complaints.save')}</Button></div>
        </form>
      ) : null}

      <div className="roomio-card roomio-table-wrap" style={{ marginTop: 16 }}>
        <table className="roomio-table">
          <thead>
            <tr>
              <th>{t('gr.vip.col.level')}</th>
              <th>{t('gr.vip.col.name')}</th>
              <th>{t('gr.vip.col.country')}</th>
              <th>{t('gr.vip.col.arrival')}</th>
              <th>{t('gr.vip.col.departure')}</th>
              <th>{t('gr.vip.col.stay')}</th>
              <th>{t('gr.vip.col.room')}</th>
              <th>{t('gr.vip.col.status')}</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={9}>{t('reception.loading')}</td></tr>
            ) : guests.length === 0 ? (
              <tr><td colSpan={9}>{t('gr.vip.empty')}</td></tr>
            ) : (
              guests.map((r) => (
                <tr key={r.id}>
                  <td><VipBadge level={r.level} /></td>
                  <td>{r.guestName}</td>
                  <td>{r.country}</td>
                  <td>{r.arrival}</td>
                  <td>{r.departure}</td>
                  <td>{t('gr.vip.nights', { count: r.nights })}</td>
                  <td>{r.room}</td>
                  <td><span className="roomio-pill">{r.status}</span></td>
                  <td>
                    <Button variant="ghost" onClick={() => void remove(r.id)}>{t('gr.complaints.delete')}</Button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
        <TableFooter total={guests.length} pageSize={25} />
      </div>
    </>
  );
}
