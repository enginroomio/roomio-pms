'use client';

import { useMemo } from 'react';
import { useSearchParams } from 'next/navigation';
import { PageHeader } from '@/components/PageHeader';
import { ReceptionTabs } from '@/components/ReceptionTabs';
import { Button, StatusBadge } from '@/components/ui';
import { ReceptionLoading } from '@/components/reception/ReceptionLoading';
import { useReservations } from '@/lib/client/use-reservations';
import { formatDate, formatMoney, getTodayArrivals, TODAY } from '@/lib/data/reception';

export default function ArrivalsPage() {
  const { reservations, loading, error, reload } = useReservations();
  const arrivals = useMemo(() => getTodayArrivals(reservations), [reservations]);

  return (
    <PageHeader
      breadcrumb="Resepsiyon > Bugün Giriş"
      title="Bugün Giriş Yapacaklar"
      description={`İş günü ${TODAY.split('-').reverse().join('.')} — check-in bekleyen rezervasyonlar.`}
      actions={
        <Button variant="secondary" disabled={loading} onClick={() => void reload()}>
          {loading ? 'Yükleniyor…' : 'Yenile'}
        </Button>
      }
    >
      <ReceptionTabs />
      <ReceptionLoading loading={loading} error={error} />
      <div className="roomio-card roomio-table-wrap">
        <table className="roomio-table">
          <thead>
            <tr>
              <th>Rez. No</th>
              <th>Misafir</th>
              <th>Çıkış</th>
              <th>Tip</th>
              <th>Acenta</th>
              <th>Fiyat</th>
              <th>Durum</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {!loading && arrivals.length === 0 ? (
              <tr><td colSpan={8} className="roomio-table-empty">Bugün giriş bekleyen rezervasyon yok.</td></tr>
            ) : (
              arrivals.map((r) => (
                <tr key={r.id}>
                  <td>{r.refNo}</td>
                  <td>{r.guestName}</td>
                  <td>{formatDate(r.checkOut)}</td>
                  <td>{r.roomType}</td>
                  <td>{r.agency}</td>
                  <td>{formatMoney(r.rate)}</td>
                  <td><StatusBadge status={r.status} /></td>
                  <td><Button href={`/reception/check-in/${r.id}`}>Check-in</Button></td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </PageHeader>
  );
}
