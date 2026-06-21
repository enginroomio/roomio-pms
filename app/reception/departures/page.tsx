import { Suspense } from 'react';
import DeparturesPageClient from './DeparturesPageClient';

export default function DeparturesPage() {
  return (
    <Suspense fallback={<div className="roomio-page-desc" style={{ padding: 24 }}>Yükleniyor…</div>}>
      <DeparturesPageClient />
    </Suspense>
  );
}
