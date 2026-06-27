import { Suspense } from 'react';
import TesaIntegrationPageClient from './TesaIntegrationPageClient';

export default function TesaIntegrationPage() {
  return (
    <Suspense fallback={<div className="roomio-page-desc" style={{ padding: 24 }}>Yükleniyor…</div>}>
      <TesaIntegrationPageClient />
    </Suspense>
  );
}
