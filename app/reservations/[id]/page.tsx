import Link from 'next/link';
import { notFound } from 'next/navigation';
import { PageHeader } from '@/components/PageHeader';
import { Button, StatusBadge } from '@/components/ui';
import { formatDate, formatMoney, getReservation } from '@/lib/data/reservations';

type Props = { params: Promise<{ id: string }> };

export default async function ReservationDetailPage({ params }: Props) {
  const { id } = await params;
  const r = getReservation(id);
  if (!r) notFound();

  return (
    <PageHeader
      breadcrumb={`Rezervasyon > ${r.refNo}`}
      title={r.guestName}
      description={`${formatDate(r.checkIn)} — ${formatDate(r.checkOut)} · ${r.roomType} · ${r.agency}`}
      actions={
        <div style={{ display: 'flex', gap: 8 }}>
          <Button variant="secondary" href="/reservations">← Liste</Button>
          <Button variant="ghost">Check-in</Button>
        </div>
      }
    >
      <div className="roomio-detail-grid">
        <div className="roomio-card">
          <h2 className="roomio-card-title">Rezervasyon</h2>
          <dl className="roomio-dl">
            <dt>Rez. No</dt><dd>{r.refNo}</dd>
            <dt>Durum</dt><dd><StatusBadge status={r.status} /></dd>
            <dt>Oda</dt><dd>{r.roomNo ? `Oda ${r.roomNo}` : 'Atanmadı'}</dd>
            <dt>Pansiyon</dt><dd>{r.mealPlan}</dd>
            <dt>Fiyat / gece</dt><dd>{formatMoney(r.rate)}</dd>
            <dt>Market</dt><dd>{r.market}</dd>
            <dt>Kayıt tarihi</dt><dd>{formatDate(r.createdAt)}</dd>
          </dl>
        </div>
        <div className="roomio-card">
          <h2 className="roomio-card-title">Misafir</h2>
          <dl className="roomio-dl">
            <dt>Ad Soyad</dt><dd>{r.guestName}</dd>
            <dt>E-posta</dt><dd>{r.email ?? '—'}</dd>
            <dt>Telefon</dt><dd>{r.phone ?? '—'}</dd>
            <dt>Yetişkin / Çocuk</dt><dd>{r.adults} / {r.children}</dd>
          </dl>
        </div>
        {r.notes ? (
          <div className="roomio-card roomio-detail-grid__full">
            <h2 className="roomio-card-title">Not</h2>
            <p>{r.notes}</p>
          </div>
        ) : null}
      </div>
      <p style={{ marginTop: 16, fontSize: '0.85rem', color: 'var(--roomio-text-muted)' }}>
        <Link href="/reservations/new" className="roomio-link">Yeni rezervasyon</Link> oluştur veya{' '}
        <Link href="/reservations" className="roomio-link">listeye dön</Link>.
      </p>
    </PageHeader>
  );
}
