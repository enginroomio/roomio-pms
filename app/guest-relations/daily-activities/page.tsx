'use client';

import { useMemo, useState } from 'react';
import { GuestRelationsTabs } from '@/components/GuestRelationsTabs';
import { PageHeader } from '@/components/PageHeader';
import { ReportToolbar, TableFooter } from '@/components/ReportToolbar';
import { Button } from '@/components/ui';
import { DEMO_DAILY_ACTIVITIES } from '@/lib/data/guest-relations';

export default function DailyActivitiesPage() {
  const [dept, setDept] = useState('Tümü');
  const [type, setType] = useState('Tümü');
  const rows = useMemo(() => DEMO_DAILY_ACTIVITIES.filter((r) => {
    if (dept !== 'Tümü' && r.department !== dept) return false;
    if (type !== 'Tümü' && r.type !== type) return false;
    return true;
  }), [dept, type]);

  return (
    <PageHeader breadcrumb="Misafir İlişkileri > Günlük Aktivite Listesi" title="Günlük Aktivite Listesi" description="Belirtilen tarih aralığındaki günlük misafir ilişkileri ve aktivitelerin listelendiği rapordur." actions={<ReportToolbar refreshLabel="Listele" onRefresh={() => {}} />}>
      <GuestRelationsTabs />
      <div className="roomio-card roomio-filter-panel">
        <div className="roomio-form-grid">
          <label className="roomio-field"><span>Tarih Aralığı</span><input className="roomio-input" defaultValue="18.06.2026 - 18.06.2026" readOnly /></label>
          <label className="roomio-field"><span>Departman</span><select className="roomio-select" value={dept} onChange={(e) => setDept(e.target.value)}><option>Tümü</option><option>Ön Büro</option><option>Misafir İlişkileri</option><option>Kat Hizmetleri</option><option>F&B</option></select></label>
          <label className="roomio-field"><span>Aktivite Türü</span><select className="roomio-select" value={type} onChange={(e) => setType(e.target.value)}><option>Tümü</option>{[...new Set(DEMO_DAILY_ACTIVITIES.map((a) => a.type))].map((t) => <option key={t}>{t}</option>)}</select></label>
        </div>
        <div className="roomio-form-actions" style={{ marginTop: 12 }}><Button>Listele</Button></div>
      </div>
      <div className="roomio-card roomio-table-wrap">
        <table className="roomio-table">
          <thead><tr><th>Tarih</th><th>Saat</th><th>Aktivite Türü</th><th>Açıklama</th><th>Misafir / Firma</th><th>Oda No</th><th>Personel</th><th>Departman</th></tr></thead>
          <tbody>{rows.map((r) => <tr key={r.id}><td>{r.date.split('-').reverse().join('.')}</td><td>{r.time}</td><td>{r.type}</td><td>{r.description}</td><td>{r.guest}</td><td>{r.roomNo}</td><td>{r.staff}</td><td>{r.department}</td></tr>)}</tbody>
        </table>
        <TableFooter total={rows.length} />
      </div>
    </PageHeader>
  );
}
