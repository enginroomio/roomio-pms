'use client';

import { GuestRelationsTabs } from '@/components/GuestRelationsTabs';
import { PageHeader } from '@/components/PageHeader';
import { Button } from '@/components/ui';
import { TableFooter } from '@/components/ReportToolbar';
import { DEMO_RESTAURANT } from '@/lib/data/guest-relations';

export default function RestaurantReservationPage() {
  return (
    <PageHeader breadcrumb="Misafir İlişkileri > Restoran Rezervasyon" title="Restoran Rezervasyon" description="Misafir restoran rezervasyonları — kısayol: Shift+R" actions={<Button>+ Rezervasyon</Button>}>
      <GuestRelationsTabs />
      <div className="roomio-card roomio-table-wrap">
        <table className="roomio-table">
          <thead><tr><th>Tarih</th><th>Saat</th><th>Misafir</th><th>Oda</th><th>Kişi</th><th>Durum</th><th>Not</th></tr></thead>
          <tbody>{DEMO_RESTAURANT.map((r) => <tr key={r.id}><td>{r.date}</td><td>{r.time}</td><td>{r.guest}</td><td>{r.roomNo}</td><td>{r.party}</td><td>{r.status}</td><td>{r.notes ?? '—'}</td></tr>)}</tbody>
        </table>
        <TableFooter total={DEMO_RESTAURANT.length} />
      </div>
    </PageHeader>
  );
}
