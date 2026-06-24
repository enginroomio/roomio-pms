'use client';

import { GuestRelationsTabs } from '@/components/GuestRelationsTabs';
import { GuestTracesPanel } from '@/components/guest-relations/GuestTracesPanel';
import { PageHeader } from '@/components/PageHeader';

export default function TracesPage() {
  return (
    <PageHeader breadcrumb="Misafir İlişkileri > Takip Listesi (Traces)" title="Takip Listesi (Traces)" description="Misafir talepleri ve departman takipleri — kısayol: Alt+P">
      <GuestRelationsTabs />
      <GuestTracesPanel />
    </PageHeader>
  );
}
