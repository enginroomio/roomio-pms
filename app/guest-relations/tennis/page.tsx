'use client';

import { GuestRelationsTabs } from '@/components/GuestRelationsTabs';
import { PageHeader } from '@/components/PageHeader';
import { Button } from '@/components/ui';
import { TableFooter } from '@/components/ReportToolbar';
import { DEMO_TENNIS } from '@/lib/data/guest-relations';

export default function TennisReservationPage() {
  return (
    <PageHeader breadcrumb="Misafir İlişkileri > Tenis Kort Rezervasyon" title="Tenis Kort Rezervasyon" description="Tenis kortu rezervasyon takibi." actions={<Button>+ Rezervasyon</Button>}>
      <GuestRelationsTabs />
      <div className="roomio-card roomio-table-wrap">
        <table className="roomio-table">
          <thead><tr><th>Tarih</th><th>Saat</th><th>Misafir</th><th>Oda</th><th>Kişi</th><th>Durum</th></tr></thead>
          <tbody>{DEMO_TENNIS.map((r) => <tr key={r.id}><td>{r.date}</td><td>{r.time}</td><td>{r.guest}</td><td>{r.roomNo}</td><td>{r.party}</td><td>{r.status}</td></tr>)}</tbody>
        </table>
        <TableFooter total={DEMO_TENNIS.length} />
      </div>
    </PageHeader>
  );
}
