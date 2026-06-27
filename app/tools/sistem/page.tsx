'use client';

import { Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { SistemModuleLayout } from '@/components/sistem/SistemModuleLayout';
import { SistemOperationsHub, SqlMessagePanel } from '@/components/sistem/SistemHubPanels';

function SistemToolsInner() {
  const searchParams = useSearchParams();
  const tab = searchParams.get('tab');

  return (
    <>
      <nav className="roomio-tabs" style={{ marginBottom: 12 }}>
        <Link href="/tools/sistem" className={`roomio-tab${!tab || tab === 'hub' ? ' is-active' : ''}`}>Sistem merkezi</Link>
        <Link href="/tools/sistem?tab=sql" className={`roomio-tab${tab === 'sql' ? ' is-active' : ''}`}>SQL mesaj</Link>
      </nav>
      {tab === 'sql' ? <SqlMessagePanel /> : <SistemOperationsHub />}
    </>
  );
}

function SistemToolsPageClient() {
  const searchParams = useSearchParams();
  const tab = searchParams.get('tab');
  const menuSearch = tab ? `?tab=${tab}` : '';

  return (
    <SistemModuleLayout
      segment={tab === 'sql' ? 'SQL Mesaj' : 'Sistem Merkezi'}
      title={tab === 'sql' ? 'SQL Mesaj' : 'Sistem Merkezi'}
      description="Kuruluş, raporlama, entegrasyonlar ve sistem araçları"
      menuSearch={menuSearch}
    >
      <SistemToolsInner />
    </SistemModuleLayout>
  );
}

export default function SistemToolsPage() {
  return (
    <Suspense fallback={<p className="roomio-page-desc">Yükleniyor…</p>}>
      <SistemToolsPageClient />
    </Suspense>
  );
}
