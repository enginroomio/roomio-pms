import { Suspense } from 'react';
import HousekeepingTasksPageClient from './HousekeepingTasksPageClient';

export default function HousekeepingTasksPage() {
  return (
    <Suspense fallback={<div className="roomio-page-desc" style={{ padding: 24 }}>Yükleniyor…</div>}>
      <HousekeepingTasksPageClient />
    </Suspense>
  );
}
