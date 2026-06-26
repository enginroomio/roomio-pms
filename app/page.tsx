import { Suspense } from 'react';
import { DashboardHome } from '@/components/DashboardHome';
import { getDashboardSnapshot } from '@/lib/server/dashboard-data';

export default async function HomePage() {
  const snapshot = await getDashboardSnapshot();

  return (
    <Suspense fallback={<div className="roomio-page-desc">Yükleniyor…</div>}>
      <DashboardHome initial={snapshot} />
    </Suspense>
  );
}
