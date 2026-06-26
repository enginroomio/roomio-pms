import { Suspense } from 'react';
import ArrivalsPageClient from './ArrivalsPageClient';

export default function ArrivalsPage() {
  return (
    <Suspense fallback={<div className="roomio-page-desc" style={{ padding: 24 }}>Yükleniyor…</div>}>
      <ArrivalsPageClient />
    </Suspense>
  );
}
