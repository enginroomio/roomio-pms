'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { GuestRelationsTabs } from '@/components/GuestRelationsTabs';
import { PageHeader } from '@/components/PageHeader';
import { StarRating } from '@/components/StarRating';
import { Button } from '@/components/ui';
import { REVIEW_CATEGORIES } from '@/lib/data/guest-relations';
import { enqueueSync } from '@/lib/sync/engine';

export default function GuestReviewEntryPage() {
  const router = useRouter();
  const [rating, setRating] = useState(5);
  const [category, setCategory] = useState(REVIEW_CATEGORIES[0]);
  const [comment, setComment] = useState('');
  const [room, setRoom] = useState('312');
  const [saved, setSaved] = useState(false);

  async function save() {
    await enqueueSync({
      entity: 'review',
      operation: 'create',
      entityId: `rev-${Date.now()}`,
      payload: { rating, category, comment, room },
    });
    setSaved(true);
    setTimeout(() => router.push('/guest-relations/reviews'), 800);
  }

  return (
    <PageHeader
      breadcrumb="Misafir İlişkileri > Misafir Yorum Girişi"
      title="Misafir Yorum Girişi"
      description="Yeni misafir yorumu oluşturun."
      actions={<Button variant="secondary" href="/guest-relations/reviews">← Yorum Listesi</Button>}
    >
      <GuestRelationsTabs />
      {saved ? <div className="roomio-card roomio-alert roomio-alert--success">Yorum kaydedildi — senkron kuyruğuna eklendi.</div> : null}
      <form className="roomio-card roomio-form" onSubmit={(e) => { e.preventDefault(); void save(); }}>
        <h2 className="roomio-card-title">Yorum Bilgileri</h2>
        <label className="roomio-field"><span>Değerlendirme</span><StarRating value={rating} onChange={setRating} /></label>
        <label className="roomio-field"><span>Kategori</span><select className="roomio-select" value={category} onChange={(e) => setCategory(e.target.value)}>{REVIEW_CATEGORIES.map((c) => <option key={c}>{c}</option>)}</select></label>
        <label className="roomio-field"><span>Yorum</span><textarea className="roomio-input" rows={5} maxLength={2000} value={comment} onChange={(e) => setComment(e.target.value)} placeholder="Misafir yorumu…" style={{ width: '100%' }} /><small>{comment.length} / 2000</small></label>
        <label className="roomio-field"><span>Misafir Odası</span><select className="roomio-select" value={room} onChange={(e) => setRoom(e.target.value)}><option value="312">312 (SUI)</option><option value="205">205 (SUP)</option><option value="108">108 (DLX)</option></select></label>
        <div className="roomio-form-actions"><Button variant="secondary" href="/guest-relations/reviews">İptal</Button><button type="submit" className="roomio-btn roomio-btn--primary">Kaydet</button></div>
      </form>
    </PageHeader>
  );
}
