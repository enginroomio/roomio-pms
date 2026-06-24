'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { PageHeader } from '@/components/PageHeader';
import { Button } from '@/components/ui';
import { ReservationFormWizard } from '@/components/forms/ReservationFormWizard';
import { roomioFetch } from '@/lib/client/api';
import { parseApiError } from '@/lib/client/api-errors';
import type { Reservation } from '@/lib/types/reservation';

export function ReservationEditClient({ id }: { id: string }) {
  const [reservation, setReservation] = useState<Reservation | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    void roomioFetch(`/api/reservations?id=${encodeURIComponent(id)}`)
      .then(async (r) => {
        if (r.status === 404) {
          return { reservation: undefined as Reservation | undefined, error: 'Rezervasyon bulunamadı' };
        }
        if (!r.ok) throw new Error(await parseApiError(r, 'Rezervasyon yüklenemedi'));
        return r.json() as Promise<{ reservation?: Reservation; error?: string }>;
      })
      .then((j) => {
        if (cancelled) return;
        if (j.reservation) setReservation(j.reservation);
        else setError(j.error ?? 'Rezervasyon bulunamadı');
      })
      .catch((err) => {
        if (!cancelled) setError(err instanceof Error ? err.message : 'Yükleme hatası');
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
      <PageHeader breadcrumb="Rezervasyon > Düzenle" title="Rezervasyon bulunamadı">
        <p className="roomio-page-desc roomio-text-warn" role="alert">{error ?? 'Kayıt yok'}</p>
        <Button variant="secondary" href="/reservations">← Liste</Button>
      </PageHeader>
    );
  }

  return (
    <PageHeader
      breadcrumb={`Rezervasyon > ${reservation.refNo} > Düzenle`}
      title={`${reservation.guestName} — düzenle`}
      description={`${reservation.checkIn} — ${reservation.checkOut}`}
      actions={
        <Button variant="secondary" href={`/reservations/${reservation.id}`}>← Detay</Button>
      }
    >
      <ReservationFormWizard existing={reservation} />
      <p style={{ marginTop: 16, fontSize: '0.85rem', color: 'var(--roomio-text-muted)' }}>
        <Link href="/reservations" className="roomio-link">Listeye dön</Link>
      </p>
    </PageHeader>
  );
}
