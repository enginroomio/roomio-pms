import { Suspense } from 'react';
import ComplaintsPageClient from './ComplaintsPageClient';

export default function ComplaintsPage() {
  return (
    <Suspense fallback={<div className="roomio-page-desc" style={{ padding: 24 }}>Yükleniyor…</div>}>
      <ComplaintsPageClient />
    </Suspense>
  );
}
