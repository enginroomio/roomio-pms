'use client';

import { GuestRelationsTabs } from '@/components/GuestRelationsTabs';
import { PageHeader } from '@/components/PageHeader';
import { Button } from '@/components/ui';
import { TableFooter } from '@/components/ReportToolbar';
import { DEMO_REPEAT_GUESTS } from '@/lib/data/guest-relations';

export default function RepeatGuestsPage() {
  return (
    <PageHeader breadcrumb="Misafir İlişkileri > Tekrarlayan Misafirler" title="Tekrarlayan Misafirler" description="Sık konaklayan misafir segmentasyonu ve sadakat takibi.">
      <GuestRelationsTabs />
      <div className="roomio-card roomio-table-wrap">
        <table className="roomio-table">
          <thead><tr><th>Misafir</th><th>Ziyaret</th><th>Son Konaklama</th><th>Toplam Gece</th><th>Segment</th><th>E-posta</th></tr></thead>
          <tbody>{DEMO_REPEAT_GUESTS.map((r) => <tr key={r.id}><td><strong>{r.guestName}</strong></td><td>{r.visits}</td><td>{r.lastStay}</td><td>{r.totalNights}</td><td>{r.segment}</td><td>{r.email ?? '—'}</td></tr>)}</tbody>
        </table>
        <TableFooter total={DEMO_REPEAT_GUESTS.length} />
      </div>
    </PageHeader>
  );
}
