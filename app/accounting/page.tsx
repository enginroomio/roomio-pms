import { Suspense } from 'react';
import AccountingPageClient from './AccountingPageClient';

export default function AccountingPage() {
  return (
    <Suspense fallback={<div className="roomio-page-desc" style={{ padding: 24 }}>Muhasebe yükleniyor…</div>}>
      <AccountingPageClient />
    </Suspense>
  );
}
