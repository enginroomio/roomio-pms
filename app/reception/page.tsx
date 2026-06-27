import { Suspense } from 'react';
import { ReceptionHubClient } from './ReceptionHubClient';

export default function ReceptionHubPage() {
  return (
    <Suspense fallback={<div className="roomio-page-desc" style={{ padding: 24 }}>Resepsiyon yükleniyor…</div>}>
      <ReceptionHubClient />
    </Suspense>
  );
}
