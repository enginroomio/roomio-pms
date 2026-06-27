'use client';

import { Suspense } from 'react';
import InHousePageClient from './InHousePageClient';

export default function InHousePage() {
  return (
    <Suspense fallback={<div className="roomio-page-desc" style={{ padding: 24 }}>Yükleniyor…</div>}>
      <InHousePageClient />
    </Suspense>
  );
}
