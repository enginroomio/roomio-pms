import Link from 'next/link';
import { GuestRelationsTabs } from '@/components/GuestRelationsTabs';
import { PageHeader } from '@/components/PageHeader';
import { TableFooter } from '@/components/ReportToolbar';
import { DEMO_GR_INHOUSE } from '@/lib/data/guest-relations';

export default function GrInHousePage() {
  return (
    <PageHeader breadcrumb="Misafir İlişkileri > In House List" title="In House List" description="Konaklayan misafirler — misafir ilişkileri görünümü.">
      <GuestRelationsTabs />
      <div className="roomio-card roomio-table-wrap">
        <table className="roomio-table">
          <thead><tr><th>Oda</th><th>Misafir</th><th>Uyruk</th><th>Giriş</th><th>Çıkış</th><th>VIP</th><th></th></tr></thead>
          <tbody>{DEMO_GR_INHOUSE.map((r) => <tr key={r.id}><td><strong>{r.roomNo}</strong></td><td>{r.guestName}</td><td>{r.nationality}</td><td>{r.arrival}</td><td>{r.departure}</td><td>{r.vip ? '★' : '—'}</td><td><Link href={`/reception/guest/${r.id}`}>Folyo</Link></td></tr>)}</tbody>
        </table>
        <TableFooter total={DEMO_GR_INHOUSE.length} />
      </div>
    </PageHeader>
  );
}
