import { Suspense } from 'react';
import FnbPageClient from './FnbPageClient';

export default function FnbPage() {
  return (
    <Suspense fallback={<div className="roomio-page-desc" style={{ padding: 24 }}>F&B yükleniyor…</div>}>
      <FnbPageClient />
    </Suspense>
  );
}
