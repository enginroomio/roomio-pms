'use client';

import { Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { GuestRelationsModuleShell } from '@/components/guest-relations/GuestRelationsModuleShell';
import { RepeatGuestsPanel } from '@/components/guest-relations/RepeatGuestsPanel';

function RepeatGuestsPageInner() {
  const searchParams = useSearchParams();
  const format = searchParams.get('format');
  const isFr3 = format === 'fr3';

  return (
    <GuestRelationsModuleShell
      segment="Tekrarlayan Misafirler"
      title={isFr3 ? 'Sürekli Misafir Listesi (Fr3)' : 'Tekrarlayan Misafirler'}
      description={isFr3 ? 'FastReport Fr3 formatında repeater export.' : 'Sık konaklayan misafir segmentasyonu ve sadakat takibi.'}
      actions={isFr3 ? (
        <a className="roomio-btn roomio-btn--secondary" href="/api/reports/export?format=pdf&category=crm&report=gs-repeater">Fr3 / PDF indir</a>
      ) : undefined}
    >
      <RepeatGuestsPanel variant={isFr3 ? 'fr3' : 'default'} />
    </GuestRelationsModuleShell>
  );
}

export default function RepeatGuestsPage() {
  return (
    <Suspense fallback={<div className="roomio-page-desc">Yükleniyor…</div>}>
      <RepeatGuestsPageInner />
    </Suspense>
  );
}
