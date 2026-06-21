'use client';

import { useState } from 'react';
import { GuestRelationsTabs } from '@/components/GuestRelationsTabs';
import { PageHeader } from '@/components/PageHeader';
import { ReportToolbar, TableFooter } from '@/components/ReportToolbar';
import { VipBadge } from '@/components/StarRating';
import { Button } from '@/components/ui';
import { DEMO_VIP_GUESTS } from '@/lib/data/guest-relations';

export default function VipGuestsPage() {
  const [level, setLevel] = useState('Tümü');
  const rows = DEMO_VIP_GUESTS.filter((r) => level === 'Tümü' || r.level === level);

  return (
    <PageHeader breadcrumb="Misafir İlişkileri > VIP Misafir Listesi" title="VIP Misafir Listesi" description="Seçilen tarih aralığında konaklayan veya konaklayacak VIP misafirler." actions={<ReportToolbar refreshLabel="Raporu Göster" onRefresh={() => {}} />}>
      <GuestRelationsTabs />
      <div className="roomio-card roomio-filter-panel">
        <div className="roomio-form-grid">
          <label className="roomio-field"><span>Tarih Aralığı</span><input className="roomio-input" defaultValue="01.06.2026 - 31.08.2026" readOnly /></label>
          <label className="roomio-field"><span>VIP Seviye</span><select className="roomio-select" value={level} onChange={(e) => setLevel(e.target.value)}><option>Tümü</option><option>Platinum</option><option>Gold</option><option>Silver</option><option>Bronze</option></select></label>
        </div>
        <div className="roomio-form-actions" style={{ marginTop: 12 }}><Button variant="secondary">Dışa Aktar</Button><Button>Raporu Göster</Button></div>
      </div>
      <div className="roomio-card roomio-table-wrap">
        <table className="roomio-table">
          <thead><tr><th>VIP Seviye</th><th>Misafir Adı</th><th>Ülke</th><th>Geliş</th><th>Ayrılış</th><th>Konaklama</th><th>Oda</th><th>Durum</th></tr></thead>
          <tbody>{rows.map((r) => <tr key={r.id}><td><VipBadge level={r.level} /></td><td>{r.guestName}</td><td>{r.country}</td><td>{r.arrival}</td><td>{r.departure}</td><td>{r.nights} Gece</td><td>{r.room}</td><td><span className="roomio-pill">{r.status}</span></td></tr>)}</tbody>
        </table>
        <TableFooter total={rows.length} pageSize={25} />
      </div>
    </PageHeader>
  );
}
