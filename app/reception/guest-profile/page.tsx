import { Suspense } from 'react';
import GuestProfilePageClient from './GuestProfilePageClient';

export default function GuestProfilePage() {
  return (
    <Suspense fallback={<div className="roomio-page-desc" style={{ padding: 24 }}>Yükleniyor…</div>}>
      <GuestProfilePageClient />
    </Suspense>
  );
}
