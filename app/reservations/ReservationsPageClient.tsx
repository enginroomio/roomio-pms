'use client';

import { useCallback, useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { PageHeader } from '@/components/PageHeader';
import { Button } from '@/components/ui';
import { ReservationEgmTab } from '@/components/egm/ReservationEgmTab';
import { ReservationListView } from '@/components/reservations/ReservationListView';
import { ReservationModuleTabs } from '@/components/reservations/ReservationModuleTabs';
import { AvailabilityCalendar } from '@/app/reservations/AvailabilityCalendar';
import type { Reservation } from '@/lib/types/reservation';

export function ReservationsPageClient() {
  const searchParams = useSearchParams();
  const tab = searchParams.get('tab');
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadReservations = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const r = await fetch('/api/reservations');
      if (!r.ok) throw new Error('Rezervasyonlar yüklenemedi');
      const j = (await r.json()) as { reservations?: Reservation[] };
      setReservations(j.reservations ?? []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Beklenmeyen hata');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadReservations();
  }, [loadReservations]);

  const title = tab === 'availability'
    ? 'Oda Planı'
    : tab === 'egm'
      ? 'EGM Kimlik Bildirimi'
      : 'Rezervasyon Listesi';

  return (
    <PageHeader
      breadcrumb={`Rezervasyon › ${title}`}
      title={title}
      description={
        tab === 'egm'
          ? 'Rezervasyon tablosu ile EGM/KBS kimlik bildirimi — kayıt, kontrol ve gönderim.'
          : 'Elektra screen-039 uyumlu liste — filtreler, durum rozetleri, F2–F10 kısayollar.'
      }
      actions={
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          <Button variant="secondary" href="/api/reports/export?format=csv">Excel (CSV)</Button>
          <Button href="/reservations/new">+ Yeni Rezervasyon (F2)</Button>
        </div>
      }
    >
      <ReservationModuleTabs />

      {loading ? (
        <p className="roomio-page-desc">Rezervasyonlar yükleniyor…</p>
      ) : error ? (
        <p className="roomio-page-desc roomio-text-warn">{error}</p>
      ) : tab === 'availability' ? (
        <AvailabilityCalendar />
      ) : tab === 'egm' ? (
        <ReservationEgmTab
          reservations={reservations}
          onRefreshReservations={() => { void loadReservations(); }}
        />
      ) : (
        <ReservationListView reservations={reservations} />
      )}
    </PageHeader>
  );
}
