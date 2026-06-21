'use client';

import { GuestRelationsTabs } from '@/components/GuestRelationsTabs';
import { PageHeader } from '@/components/PageHeader';
import { Button } from '@/components/ui';
import { TableFooter } from '@/components/ReportToolbar';
import { DEMO_COMPLAINTS } from '@/lib/data/guest-relations';

export default function ComplaintsPage() {
  return (
    <PageHeader breadcrumb="Misafir İlişkileri > Arıza ve Şikayet Listesi" title="Arıza ve Şikayet Listesi" description="Misafir şikayetleri ve teknik arıza kayıtları." actions={<Button>+ Kayıt</Button>}>
      <GuestRelationsTabs />
      <div className="roomio-card roomio-table-wrap">
        <table className="roomio-table">
          <thead><tr><th>Tarih</th><th>Oda</th><th>Misafir</th><th>Kategori</th><th>Açıklama</th><th>Öncelik</th><th>Durum</th></tr></thead>
          <tbody>{DEMO_COMPLAINTS.map((r) => <tr key={r.id}><td>{r.date}</td><td>{r.roomNo}</td><td>{r.guest}</td><td>{r.category}</td><td>{r.description}</td><td>{r.priority === 'Acil' ? <span className="roomio-text-warn">Acil</span> : 'Normal'}</td><td>{r.status}</td></tr>)}</tbody>
        </table>
        <TableFooter total={DEMO_COMPLAINTS.length} />
      </div>
    </PageHeader>
  );
}
