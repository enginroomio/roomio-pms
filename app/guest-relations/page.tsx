import { Suspense } from 'react';
import GuestRelationsHubPageClient from './GuestRelationsHubPageClient';

export default function GuestRelationsHubPage() {
  return (
    <Suspense fallback={<div className="roomio-page-desc" style={{ padding: 24 }}>Yükleniyor…</div>}>
      <GuestRelationsHubPageClient />
    </Suspense>
  );
}
