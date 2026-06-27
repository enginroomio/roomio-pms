'use client';

import { useRouter } from 'next/navigation';
import { useMemo, useState } from 'react';
import { GuestRelationsTabs } from '@/components/GuestRelationsTabs';
import { PageHeader } from '@/components/PageHeader';
import { StarRating } from '@/components/StarRating';
import { Button } from '@/components/ui';
import { roomioFetch } from '@/lib/client/api';
import { useReservations } from '@/lib/client/use-reservations';
import { REVIEW_CATEGORIES } from '@/lib/data/guest-relations';

export default function GuestReviewEntryPage() {
  const router = useRouter();
  const { reservations } = useReservations();
  const inHouse = useMemo(
    () => reservations.filter((r) => r.status === 'CHECKED_IN' && r.roomNo),
    [reservations],
  );

  const [reservationId, setReservationId] = useState('');
  const [rating, setRating] = useState(5);
  const [category, setCategory] = useState(REVIEW_CATEGORIES[0]);
  const [comment, setComment] = useState('');
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  const selected = inHouse.find((r) => r.id === reservationId);

  async function save(e: React.FormEvent) {
    e.preventDefault();
    if (!selected || !comment.trim()) {
      setMsg('Oda ve yorum gerekli');
      return;
    }
    setBusy(true);
    setMsg(null);
    try {
      const res = await roomioFetch('/api/guest-reviews', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          guestName: selected.guestName,
          roomNo: selected.roomNo,
          rating,
          comment,
          title: category,
          category,
          source: 'Otel Web',
        }),
      });
      const j = (await res.json()) as { ok?: boolean; error?: string };
      if (!res.ok || !j.ok) throw new Error(j.error ?? 'Kayıt başarısız');
      router.push('/guest-relations/reviews');
    } catch (err) {
      setMsg(err instanceof Error ? err.message : 'Hata');
      setBusy(false);
    }
  }

  return (
    <PageHeader
      breadcrumb="Misafir İlişkileri > Misafir Yorum Girişi"
      title="Misafir Yorum Girişi"
      description="Yeni misafir yorumu oluşturun."
      actions={<Button variant="secondary" href="/guest-relations/reviews">← Yorum Listesi</Button>}
    >
      <GuestRelationsTabs />
      <form className="roomio-card roomio-form" onSubmit={(e) => void save(e)}>
        <h2 className="roomio-card-title">Yorum Bilgileri</h2>
        <label className="roomio-field"><span>Değerlendirme</span><StarRating value={rating} onChange={setRating} /></label>
        <label className="roomio-field"><span>Kategori</span><select className="roomio-select" value={category} onChange={(e) => setCategory(e.target.value)}>{REVIEW_CATEGORIES.map((c) => <option key={c}>{c}</option>)}</select></label>
        <label className="roomio-field"><span>Yorum</span><textarea className="roomio-input" rows={5} maxLength={2000} value={comment} onChange={(e) => setComment(e.target.value)} placeholder="Misafir yorumu…" style={{ width: '100%' }} /><small>{comment.length} / 2000</small></label>
        <label className="roomio-field"><span>Misafir Odası</span>
          <select className="roomio-select" value={reservationId} onChange={(e) => setReservationId(e.target.value)}>
            <option value="">Seçin…</option>
            {inHouse.map((r) => (
              <option key={r.id} value={r.id}>{r.roomNo} — {r.guestName}</option>
            ))}
          </select>
        </label>
        <div className="roomio-form-actions">
          <Button variant="secondary" href="/guest-relations/reviews">İptal</Button>
          <Button type="submit" disabled={busy}>{busy ? 'Kaydediliyor…' : 'Kaydet'}</Button>
        </div>
        {msg ? <p className="roomio-page-desc roomio-text-warn">{msg}</p> : null}
      </form>
    </PageHeader>
  );
}
