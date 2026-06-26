import { Suspense } from 'react';
import TracesPageClient from './TracesPageClient';

export default function TracesPage() {
  return (
    <Suspense fallback={<div className="roomio-page-desc" style={{ padding: 24 }}>Yükleniyor…</div>}>
      <TracesPageClient />
    </Suspense>
  );
}
