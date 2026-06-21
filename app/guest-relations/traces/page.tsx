'use client';

import { GuestRelationsTabs } from '@/components/GuestRelationsTabs';
import { PageHeader } from '@/components/PageHeader';
import { Button } from '@/components/ui';
import { TableFooter } from '@/components/ReportToolbar';
import { DEMO_TRACES } from '@/lib/data/guest-relations';

export default function TracesPage() {
  return (
    <PageHeader breadcrumb="Misafir İlişkileri > Takip Listesi (Traces)" title="Takip Listesi (Traces)" description="Misafir talepleri ve departman takipleri — kısayol: Alt+P" actions={<Button>+ Yeni Trace</Button>}>
      <GuestRelationsTabs />
      <div className="roomio-card roomio-table-wrap">
        <table className="roomio-table">
          <thead><tr><th>Tarih</th><th>Misafir</th><th>Oda</th><th>Konu</th><th>Termin</th><th>Durum</th><th>Sorumlu</th></tr></thead>
          <tbody>{DEMO_TRACES.map((r) => <tr key={r.id}><td>{r.date}</td><td>{r.guest}</td><td>{r.roomNo}</td><td>{r.subject}</td><td>{r.due}</td><td><span className={`roomio-pill${r.status === 'Tamamlandı' ? ' roomio-pill--ok' : ''}`}>{r.status}</span></td><td>{r.assignee}</td></tr>)}</tbody>
        </table>
        <TableFooter total={DEMO_TRACES.length} />
      </div>
    </PageHeader>
  );
}
