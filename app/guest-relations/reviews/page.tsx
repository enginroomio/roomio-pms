'use client';

import { useMemo, useState } from 'react';
import { GuestRelationsTabs } from '@/components/GuestRelationsTabs';
import { PageHeader } from '@/components/PageHeader';
import { ReportPreviewHeader, ReportToolbar, TableFooter } from '@/components/ReportToolbar';
import { StarDisplay } from '@/components/StarRating';
import { Button } from '@/components/ui';
import { DEMO_REVIEWS, REVIEW_SOURCES } from '@/lib/data/guest-relations';

export default function GuestReviewsPage() {
  const [source, setSource] = useState('Tümü');
  const [rating, setRating] = useState('Tümü');
  const [status, setStatus] = useState('Tümü');
  const [answeredOnly, setAnsweredOnly] = useState(false);
  const [query, setQuery] = useState('');
  const [applied, setApplied] = useState(true);

  const rows = useMemo(() => {
    if (!applied) return DEMO_REVIEWS;
    return DEMO_REVIEWS.filter((r) => {
      if (source !== 'Tümü' && r.source !== source) return false;
      if (rating !== 'Tümü' && r.rating !== Number(rating)) return false;
      if (status !== 'Tümü' && (status === 'Cevaplandı' ? r.status !== 'answered' : r.status !== 'pending')) return false;
      if (answeredOnly && r.status !== 'answered') return false;
      if (query && !r.guestName.toLowerCase().includes(query.toLowerCase()) && !r.roomNo.includes(query)) return false;
      return true;
    });
  }, [source, rating, status, answeredOnly, query, applied]);

  return (
    <PageHeader
      breadcrumb="Misafir İlişkileri > Misafir Yorum Listesi"
      title="Misafir Yorum Listesi"
      description="Belirtilen kriterlere göre misafir yorumlarının listelendiği rapordur."
      actions={
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          <ReportToolbar onRefresh={() => setApplied(true)} showSave />
          <Button href="/guest-relations/reviews/new">+ Yorum Girişi</Button>
        </div>
      }
    >
      <GuestRelationsTabs />

      <div className="roomio-card roomio-filter-panel">
        <div className="roomio-form-grid">
          <label className="roomio-field"><span>Tarih Aralığı</span><input className="roomio-input" defaultValue="01.05.2026 - 25.05.2026" readOnly /></label>
          <label className="roomio-field"><span>Kaynak</span><select className="roomio-select" value={source} onChange={(e) => setSource(e.target.value)}>{REVIEW_SOURCES.map((s) => <option key={s}>{s}</option>)}</select></label>
          <label className="roomio-field"><span>Puan</span><select className="roomio-select" value={rating} onChange={(e) => setRating(e.target.value)}><option>Tümü</option><option>5</option><option>4</option><option>3</option></select></label>
          <label className="roomio-field"><span>Durum</span><select className="roomio-select" value={status} onChange={(e) => setStatus(e.target.value)}><option>Tümü</option><option>Cevaplandı</option><option>Cevaplanmadı</option></select></label>
          <label className="roomio-field"><span>Misafir / Oda</span><input className="roomio-input" value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Ad veya oda no" /></label>
          <label className="roomio-field roomio-field--row"><input type="checkbox" checked={answeredOnly} onChange={(e) => setAnsweredOnly(e.target.checked)} /><span>Cevaplanmış yorumlar</span></label>
        </div>
        <div className="roomio-form-actions" style={{ marginTop: 12 }}>
          <Button onClick={() => setApplied(true)}>Raporu Getir</Button>
          <Button variant="secondary" onClick={() => { setSource('Tümü'); setRating('Tümü'); setStatus('Tümü'); setAnsweredOnly(false); setQuery(''); }}>Filtreleri Temizle</Button>
        </div>
      </div>

      <div className="roomio-card roomio-table-wrap">
        <ReportPreviewHeader title="MİSAFİR YORUM LİSTESİ" dateRange="01.05.2026 – 25.05.2026" />
        <table className="roomio-table roomio-table--compact">
          <thead>
            <tr><th>No</th><th>Tarih</th><th>Misafir</th><th>Oda</th><th>Konaklama</th><th>Kaynak</th><th>Puan</th><th>Başlık</th><th>Yorum</th><th>Cevap</th><th>Durum</th><th>Dil</th></tr>
          </thead>
          <tbody>
            {rows.map((r, i) => (
              <tr key={r.id}>
                <td>{i + 1}</td>
                <td>{r.date}</td>
                <td><strong>{r.guestName}</strong></td>
                <td>{r.roomNo}</td>
                <td>{r.stayRange}</td>
                <td>{r.source}</td>
                <td><StarDisplay value={r.rating} /></td>
                <td>{r.title}</td>
                <td className="roomio-cell-wrap">{r.comment}</td>
                <td className="roomio-cell-wrap">{r.response ?? '—'}</td>
                <td><span className={r.status === 'answered' ? 'roomio-pill roomio-pill--ok' : 'roomio-pill'}>{r.status === 'answered' ? 'Cevaplandı' : 'Cevaplanmadı'}</span></td>
                <td>{r.lang}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <TableFooter total={rows.length} />
        <p className="roomio-report-footnote">Bu rapor Roomio PMS tarafından oluşturulmuştur.</p>
      </div>
    </PageHeader>
  );
}
