'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { ReportPreviewHeader, ReportToolbar, TableFooter } from '@/components/ReportToolbar';
import { StarDisplay } from '@/components/StarRating';
import { Button } from '@/components/ui';
import { useI18n } from '@/components/i18n/I18nProvider';
import { roomioFetch } from '@/lib/client/api';
import type { GuestReview } from '@/lib/data/guest-relations';
import { REVIEW_SOURCES } from '@/lib/data/guest-relations';

export function GuestReviewsPanel() {
  const { t } = useI18n();
  const [source, setSource] = useState('Tümü');
  const [rating, setRating] = useState('Tümü');
  const [status, setStatus] = useState('Tümü');
  const [query, setQuery] = useState('');
  const [reviews, setReviews] = useState<GuestReview[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    guestName: '',
    roomNo: '',
    rating: 5,
    title: '',
    comment: '',
    source: 'Otel Web',
  });

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (source !== 'Tümü') params.set('source', source);
      if (rating !== 'Tümü') params.set('rating', rating);
      if (status === 'Cevaplandı') params.set('status', 'answered');
      if (status === 'Cevaplanmadı') params.set('status', 'pending');
      if (query.trim()) params.set('q', query.trim());
      const res = await roomioFetch(`/api/guest-reviews?${params}`);
      const j = (await res.json()) as { reviews?: GuestReview[] };
      setReviews(j.reviews ?? []);
    } finally {
      setLoading(false);
    }
  }, [source, rating, status, query]);

  useEffect(() => {
    void load();
  }, [load]);

  const rows = useMemo(() => reviews, [reviews]);

  async function saveReview(e: React.FormEvent) {
    e.preventDefault();
    await roomioFetch('/api/guest-reviews', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    });
    setShowForm(false);
    setForm({ guestName: '', roomNo: '', rating: 5, title: '', comment: '', source: 'Otel Web' });
    await load();
  }

  async function answer(id: string) {
    const response = window.prompt(t('gr.reviews.answerPrompt'));
    if (!response?.trim()) return;
    await roomioFetch('/api/guest-reviews', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'answer', id, response }),
    });
    await load();
  }

  async function remove(id: string) {
    if (!window.confirm(t('gr.reviews.deleteConfirm'))) return;
    await roomioFetch(`/api/guest-reviews?id=${encodeURIComponent(id)}`, { method: 'DELETE' });
    await load();
  }

  return (
    <>
      <div className="roomio-card roomio-filter-panel">
        <div className="roomio-form-grid">
          <label className="roomio-field"><span>{t('gr.reviews.source')}</span><select className="roomio-select" value={source} onChange={(e) => setSource(e.target.value)}>{REVIEW_SOURCES.map((s) => <option key={s}>{s}</option>)}</select></label>
          <label className="roomio-field"><span>{t('gr.reviews.rating')}</span><select className="roomio-select" value={rating} onChange={(e) => setRating(e.target.value)}><option>{t('gr.vip.all')}</option><option>5</option><option>4</option><option>3</option></select></label>
          <label className="roomio-field"><span>{t('gr.complaints.col.status')}</span><select className="roomio-select" value={status} onChange={(e) => setStatus(e.target.value)}><option>{t('gr.vip.all')}</option><option>{t('gr.reviews.answered')}</option><option>{t('gr.reviews.pending')}</option></select></label>
          <label className="roomio-field"><span>{t('gr.reviews.search')}</span><input className="roomio-input" value={query} onChange={(e) => setQuery(e.target.value)} placeholder={t('gr.reviews.searchPlaceholder')} /></label>
        </div>
        <div className="roomio-form-actions" style={{ marginTop: 12 }}>
          <Button onClick={() => void load()}>{t('gr.reviews.fetch')}</Button>
          <Button variant="secondary" onClick={() => setShowForm((v) => !v)}>{showForm ? t('gr.complaints.cancel') : t('gr.reviews.add')}</Button>
          <ReportToolbar onRefresh={() => void load()} showSave />
        </div>
      </div>

      {showForm ? (
        <form className="roomio-card roomio-form" onSubmit={(e) => void saveReview(e)} style={{ marginTop: 16 }}>
          <div className="roomio-form-grid">
            <label className="roomio-field"><span>{t('gr.vip.col.name')}</span><input className="roomio-input" value={form.guestName} onChange={(e) => setForm((p) => ({ ...p, guestName: e.target.value }))} required /></label>
            <label className="roomio-field"><span>{t('gr.vip.col.room')}</span><input className="roomio-input" value={form.roomNo} onChange={(e) => setForm((p) => ({ ...p, roomNo: e.target.value }))} required /></label>
            <label className="roomio-field"><span>{t('gr.reviews.rating')}</span><input className="roomio-input" type="number" min="1" max="5" value={form.rating} onChange={(e) => setForm((p) => ({ ...p, rating: Number(e.target.value) }))} /></label>
            <label className="roomio-field"><span>{t('gr.reviews.title')}</span><input className="roomio-input" value={form.title} onChange={(e) => setForm((p) => ({ ...p, title: e.target.value }))} /></label>
            <label className="roomio-field roomio-field--full"><span>{t('gr.reviews.comment')}</span><input className="roomio-input" value={form.comment} onChange={(e) => setForm((p) => ({ ...p, comment: e.target.value }))} required /></label>
          </div>
          <div className="roomio-form-actions"><Button type="submit">{t('gr.complaints.save')}</Button></div>
        </form>
      ) : null}

      <div className="roomio-card roomio-table-wrap">
        <ReportPreviewHeader title={t('gr.reviews.listTitle')} dateRange={t('gr.reviews.liveData')} />
        <table className="roomio-table roomio-table--compact">
          <thead>
            <tr>
              <th>#</th>
              <th>{t('gr.complaints.col.date')}</th>
              <th>{t('gr.vip.col.name')}</th>
              <th>{t('gr.vip.col.room')}</th>
              <th>{t('gr.reviews.source')}</th>
              <th>{t('gr.reviews.rating')}</th>
              <th>{t('gr.reviews.title')}</th>
              <th>{t('gr.reviews.comment')}</th>
              <th>{t('gr.reviews.response')}</th>
              <th>{t('gr.complaints.col.status')}</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={11}>{t('reception.loading')}</td></tr>
            ) : rows.length === 0 ? (
              <tr><td colSpan={11}>{t('gr.complaints.empty')}</td></tr>
            ) : (
              rows.map((r, i) => (
                <tr key={r.id}>
                  <td>{i + 1}</td>
                  <td>{r.date}</td>
                  <td><strong>{r.guestName}</strong></td>
                  <td>{r.roomNo}</td>
                  <td>{r.source}</td>
                  <td><StarDisplay value={r.rating} /></td>
                  <td>{r.title}</td>
                  <td className="roomio-cell-wrap">{r.comment}</td>
                  <td className="roomio-cell-wrap">{r.response ?? '—'}</td>
                  <td><span className={r.status === 'answered' ? 'roomio-pill roomio-pill--ok' : 'roomio-pill'}>{r.status === 'answered' ? t('gr.reviews.answered') : t('gr.reviews.pending')}</span></td>
                  <td>
                    {r.status === 'pending' ? (
                      <>
                        <Button variant="secondary" onClick={() => void answer(r.id)}>{t('gr.reviews.answer')}</Button>
                        {' '}
                      </>
                    ) : null}
                    <Button variant="ghost" onClick={() => void remove(r.id)}>{t('gr.complaints.delete')}</Button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
        <TableFooter total={rows.length} />
      </div>
    </>
  );
}
