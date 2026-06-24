'use client';

import { GuestRelationsTabs } from '@/components/GuestRelationsTabs';
import { ReclamationsPanel } from '@/components/guest-relations/ReclamationsPanel';
import { PageHeader } from '@/components/PageHeader';

export default function ReclamationsPage() {
  return (
    <PageHeader breadcrumb="Misafir İlişkileri > Reklamasyon" title="Reklamasyon" description="Misafir tazminat ve reklamasyon süreç takibi.">
      <GuestRelationsTabs />
      <ReclamationsPanel />
    </PageHeader>
  );
}
