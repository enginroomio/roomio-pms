'use client';

import Link from 'next/link';
import { useMemo } from 'react';
import { useSearchParams } from 'next/navigation';
import { PageHeader } from '@/components/PageHeader';
import { ReceptionTabs } from '@/components/ReceptionTabs';
import { Button } from '@/components/ui';
import { ReceptionLoading } from '@/components/reception/ReceptionLoading';
import { ReceptionSubTabContent, receptionSubTabMeta } from '@/components/reception/ReceptionSubTabContent';
import { useReservations } from '@/lib/client/use-reservations';
import { getVacantRooms } from '@/lib/data/reception';

export default function VacantRoomsPageClient() {
  const searchParams = useSearchParams();
  const tab = searchParams.get('tab');
  const { reservations, loading, error, reload } = useReservations();
  const vacantRooms = useMemo(() => getVacantRooms(reservations), [reservations]);
  const clean = vacantRooms.filter((r) => r.status === 'CLEAN');
  const dirty = vacantRooms.filter((r) => r.status === 'DIRTY');

  if (tab === 'deposit' || tab === 'deposit-collect' || tab === 'deposit-refund') {
    const meta = receptionSubTabMeta(tab === 'deposit' ? 'deposit' : tab);
    return (
      <PageHeader breadcrumb={`Ön Kasa > ${meta.title}`} title={meta.title} description={meta.description}>
        <ReceptionTabs />
        <ReceptionSubTabContent tab={tab} />
        <div className="roomio-form-actions" style={{ marginTop: 16 }}>
          <Button href="/reception/vacant">← Boş odalara dön</Button>
        </div>
      </PageHeader>
    );
  }

  return (
    <PageHeader
      breadcrumb="Resepsiyon > Boş Oda Listesi"
      title="Boş Odalar"
      description="Check-in için müsait odalar — temiz / kirli durumu."
      actions={
        <Button variant="secondary" disabled={loading} onClick={() => void reload()}>
          {loading ? 'Yükleniyor…' : 'Yenile'}
        </Button>
      }
    >
      <ReceptionTabs />
      <ReceptionLoading loading={loading} error={error} />
      <div className="roomio-detail-grid">
        <div className="roomio-card">
          <h2 className="roomio-card-title">Temiz — Check-in hazır ({loading ? '…' : clean.length})</h2>
          <div className="roomio-rack-preview">
            {clean.map((r) => (
              <div key={r.roomNo} className="roomio-room clean" title={`Kat ${r.floor} · ${r.type}`}>
                {r.roomNo}
              </div>
            ))}
          </div>
        </div>
        <div className="roomio-card">
          <h2 className="roomio-card-title">Kirli — HK bekliyor ({loading ? '…' : dirty.length})</h2>
          <div className="roomio-rack-preview">
            {dirty.map((r) => (
              <div key={r.roomNo} className="roomio-room dirty" title={`Kat ${r.floor} · ${r.type}`}>
                {r.roomNo}
              </div>
            ))}
          </div>
        </div>
      </div>
    </PageHeader>
  );
}
