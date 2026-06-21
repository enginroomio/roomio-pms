'use client';

import { GuestRelationsTabs } from '@/components/GuestRelationsTabs';
import { PageHeader } from '@/components/PageHeader';
import { ReportToolbar, TableFooter } from '@/components/ReportToolbar';
import { DEMO_GUEST_ACTIVITIES } from '@/lib/data/guest-relations';

export default function GuestActivitiesPage() {
  return (
    <PageHeader breadcrumb="Misafir İlişkileri > Misafir Aktivite Listesi" title="Misafir Aktivite Listesi" description="Misafir bazlı özel gün ve VIP aktiviteleri." actions={<ReportToolbar refreshLabel="Raporla" onRefresh={() => {}} />}>
      <GuestRelationsTabs />
      <div className="roomio-card roomio-table-wrap">
        <table className="roomio-table">
          <thead><tr><th>Tarih / Saat</th><th>Misafir Adı</th><th>Oda No</th><th>Uyruk</th><th>Aktivite</th><th>Açıklama</th><th>İşlem Yapan</th></tr></thead>
          <tbody>{DEMO_GUEST_ACTIVITIES.map((r) => <tr key={r.id}><td>{r.datetime}</td><td><strong>{r.guestName}</strong></td><td>{r.roomNo}</td><td>{r.nationality}</td><td>{r.activity}</td><td>{r.description}</td><td>{r.staff}</td></tr>)}</tbody>
        </table>
        <TableFooter total={DEMO_GUEST_ACTIVITIES.length} />
      </div>
    </PageHeader>
  );
}
