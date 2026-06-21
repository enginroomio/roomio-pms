import { GuestRelationsTabs } from '@/components/GuestRelationsTabs';
import { PageHeader } from '@/components/PageHeader';
import { TableFooter } from '@/components/ReportToolbar';
import { DEMO_INFO_RACK } from '@/lib/data/guest-relations';

export default function InfoRackPage() {
  return (
    <PageHeader breadcrumb="Misafir İlişkileri > Info Rack (İsim Listesi)" title="Info Rack (İsim Listesi)" description="Resepsiyon isim panosu — unvan ve dil bilgisi.">
      <GuestRelationsTabs />
      <div className="roomio-card roomio-table-wrap">
        <table className="roomio-table">
          <thead><tr><th>Oda</th><th>Unvan</th><th>Misafir</th><th>Dil</th><th>Not</th></tr></thead>
          <tbody>{DEMO_INFO_RACK.map((r) => <tr key={r.id}><td><strong>{r.roomNo}</strong></td><td>{r.title}</td><td>{r.guestName}</td><td>{r.language}</td><td>{r.notes}</td></tr>)}</tbody>
        </table>
        <TableFooter total={DEMO_INFO_RACK.length} />
      </div>
    </PageHeader>
  );
}
