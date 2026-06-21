'use client';

import { GuestRelationsTabs } from '@/components/GuestRelationsTabs';
import { PageHeader } from '@/components/PageHeader';
import { Button } from '@/components/ui';
import { TableFooter } from '@/components/ReportToolbar';
import { DEMO_LOST_FOUND } from '@/lib/data/guest-relations';

export default function LostFoundPage() {
  return (
    <PageHeader breadcrumb="Misafir İlişkileri > Kayıp ve Bulunan Listesi" title="Kayıp ve Bulunan Listesi" description="Kayıp eşya ve buluntu takibi.">
      <GuestRelationsTabs />
      <div className="roomio-card roomio-table-wrap">
        <table className="roomio-table">
          <thead><tr><th>Tarih</th><th>Tip</th><th>Eşya</th><th>Konum</th><th>Misafir</th><th>Oda</th><th>Durum</th></tr></thead>
          <tbody>{DEMO_LOST_FOUND.map((r) => <tr key={r.id}><td>{r.date}</td><td>{r.type}</td><td>{r.item}</td><td>{r.location}</td><td>{r.guest ?? '—'}</td><td>{r.roomNo ?? '—'}</td><td>{r.status}</td></tr>)}</tbody>
        </table>
        <TableFooter total={DEMO_LOST_FOUND.length} />
      </div>
    </PageHeader>
  );
}
