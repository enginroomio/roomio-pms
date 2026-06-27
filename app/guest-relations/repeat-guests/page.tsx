'use client';

import { Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { GuestRelationsTabs } from '@/components/GuestRelationsTabs';
import { RepeatGuestsPanel } from '@/components/guest-relations/RepeatGuestsPanel';
import { PageHeader } from '@/components/PageHeader';

function RepeatGuestsPageInner() {
  const searchParams = useSearchParams();
  const format = searchParams.get('format');
  const isFr3 = format === 'fr3';

  return (
    <PageHeader
      breadcrumb="Misafir İlişkileri > Tekrarlayan Misafirler"
      title={isFr3 ? 'Sürekli Misafir Listesi (Fr3)' : 'Tekrarlayan Misafirler'}
      description={isFr3 ? 'FastReport Fr3 formatında repeater export.' : 'Sık konaklayan misafir segmentasyonu ve sadakat takibi.'}
      actions={isFr3 ? (
        <a className="roomio-btn roomio-btn--secondary" href="/api/reports/export?format=pdf&category=crm&report=gs-repeater">Fr3 / PDF indir</a>
      ) : undefined}
    >
      <GuestRelationsTabs />
      <RepeatGuestsPanel variant={isFr3 ? 'fr3' : 'default'} />
    </PageHeader>
  );
}

export default function RepeatGuestsPage() {
  return (
    <Suspense fallback={<div className="roomio-page-desc">Yükleniyor…</div>}>
      <RepeatGuestsPageInner />
    </Suspense>
  );
}
