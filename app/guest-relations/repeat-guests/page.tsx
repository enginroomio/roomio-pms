'use client';

import { GuestRelationsTabs } from '@/components/GuestRelationsTabs';
import { RepeatGuestsPanel } from '@/components/guest-relations/RepeatGuestsPanel';
import { PageHeader } from '@/components/PageHeader';

export default function RepeatGuestsPage() {
  return (
    <PageHeader breadcrumb="Misafir İlişkileri > Tekrarlayan Misafirler" title="Tekrarlayan Misafirler" description="Sık konaklayan misafir segmentasyonu ve sadakat takibi.">
      <GuestRelationsTabs />
      <RepeatGuestsPanel />
    </PageHeader>
  );
}
