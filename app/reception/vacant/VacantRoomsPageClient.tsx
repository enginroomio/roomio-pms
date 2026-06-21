'use client';

import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { PageHeader } from '@/components/PageHeader';
import { ReceptionTabs } from '@/components/ReceptionTabs';
import { Button } from '@/components/ui';
import { DEMO_DEPOSITS, formatMoney } from '@/lib/data/cash';
import { VACANT_ROOMS } from '@/lib/data/reception';

export default function VacantRoomsPageClient() {
  const searchParams = useSearchParams();
  const tab = searchParams.get('tab');
  const clean = VACANT_ROOMS.filter((r) => r.status === 'CLEAN');
  const dirty = VACANT_ROOMS.filter((r) => r.status === 'DIRTY');

  if (tab === 'deposit') {
    return (
      <PageHeader breadcrumb="Ön Kasa > Depozit" title="Depozit İşlemleri" description="Misafir depozit alma, iade ve mahsup kayıtları.">
        <ReceptionTabs />
        <div className="roomio-card roomio-table-wrap" style={{ marginTop: 16 }}>
          <table className="roomio-table">
            <thead>
              <tr><th>Misafir</th><th>Oda</th><th>Tutar</th><th>Yöntem</th><th>Tarih</th><th>Durum</th></tr>
            </thead>
            <tbody>
              {DEMO_DEPOSITS.map((d) => (
                <tr key={d.id}>
                  <td>{d.guest}</td>
                  <td><strong>{d.roomNo}</strong></td>
                  <td>{formatMoney(d.amount)}</td>
                  <td>{d.method}</td>
                  <td>{d.takenAt}</td>
                  <td>
                    <span className="roomio-badge">
                      {d.status === 'held' ? 'Tutuluyor' : d.status === 'applied' ? 'Mahsup' : 'İade'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
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
    >
      <ReceptionTabs />
      <div className="roomio-detail-grid">
        <div className="roomio-card">
          <h2 className="roomio-card-title">Temiz — Check-in hazır ({clean.length})</h2>
          <div className="roomio-rack-preview">
            {clean.map((r) => (
              <div key={r.roomNo} className="roomio-room clean" title={`Kat ${r.floor} · ${r.type}`}>
                {r.roomNo}
              </div>
            ))}
          </div>
        </div>
        <div className="roomio-card">
          <h2 className="roomio-card-title">Kirli — HK bekliyor ({dirty.length})</h2>
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
