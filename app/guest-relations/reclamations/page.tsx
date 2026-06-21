'use client';

import { GuestRelationsTabs } from '@/components/GuestRelationsTabs';
import { PageHeader } from '@/components/PageHeader';
import { Button } from '@/components/ui';
import { TableFooter } from '@/components/ReportToolbar';
import { DEMO_RECLAMATIONS } from '@/lib/data/guest-relations';

export default function ReclamationsPage() {
  return (
    <PageHeader breadcrumb="Misafir İlişkileri > Reklamasyon" title="Reklamasyon" description="Misafir tazminat ve reklamasyon süreç takibi.">
      <GuestRelationsTabs />
      <div className="roomio-card roomio-table-wrap">
        <table className="roomio-table">
          <thead><tr><th>Ref</th><th>Tarih</th><th>Misafir</th><th>Oda</th><th>Konu</th><th>Tazminat</th><th>Durum</th></tr></thead>
          <tbody>{DEMO_RECLAMATIONS.map((r) => <tr key={r.id}><td><strong>{r.refNo}</strong></td><td>{r.date}</td><td>{r.guest}</td><td>{r.roomNo}</td><td>{r.subject}</td><td>{r.compensation}</td><td><span className="roomio-pill">{r.status}</span></td></tr>)}</tbody>
        </table>
        <TableFooter total={DEMO_RECLAMATIONS.length} />
      </div>
    </PageHeader>
  );
}
