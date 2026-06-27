'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { PageHeader } from '@/components/PageHeader';
import { Button, StatusBadge } from '@/components/ui';
import { ReservationFolioSummary } from '@/components/reservations/ReservationFolioSummary';
import { formatDate, formatMoney } from '@/lib/data/reservations';
import { roomioFetch } from '@/lib/client/api';
import { parseApiError } from '@/lib/client/api-errors';
import type { Reservation } from '@/lib/types/reservation';

export function ReservationDetailClient({ id }: { id: string }) {
  const [reservation, setReservation] = useState<Reservation | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    void roomioFetch(`/api/reservations?id=${encodeURIComponent(id)}`)
      .then(async (r) => {
        if (r.status === 404) return null;
        if (!r.ok) throw new Error(await parseApiError(r, 'Rezervasyon yüklenemedi'));
        return r.json() as Promise<{ reservation?: Reservation }>;
      })
      .then((j) => {
        if (cancelled) return;
        if (j?.reservation) setReservation(j.reservation);
        else setError('Rezervasyon bulunamadı');
      })
      .catch((err) => {
        if (!cancelled) setError(err instanceof Error ? err.message : 'Rezervasyon yüklenemedi');
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [id]);

  if (loading) {
    return <p className="roomio-page-desc">Rezervasyon yükleniyor…</p>;
  }

  if (error || !reservation) {
    return (
      <PageHeader breadcrumb="Rezervasyon" title="Kayıt bulunamadı">
        <p className="roomio-page-desc">{error ?? 'Rezervasyon bulunamadı'}</p>
        <Button variant="secondary" href="/reservations">← Liste</Button>
      </PageHeader>
    );
  }

  const r = reservation;

  return (
    <PageHeader
      breadcrumb={`Rezervasyon > ${r.refNo}`}
      title={r.guestName}
      description={`${formatDate(r.checkIn)} — ${formatDate(r.checkOut)} · ${r.roomType} · ${r.agency}`}
      actions={
        <div style={{ display: 'flex', gap: 8 }}>
          <Button variant="secondary" href="/reservations">← Liste</Button>
          <Button variant="secondary" href={`/reservations/${r.id}/edit`}>Düzenle</Button>
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
        <ReservationFolioSummary reservationId={r.id} guestName={r.guestName} />
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
