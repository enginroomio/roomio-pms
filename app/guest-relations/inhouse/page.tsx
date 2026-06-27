'use client';

import { GuestRelationsTabs } from '@/components/GuestRelationsTabs';
import { GrInHousePanel } from '@/components/guest-relations/GrInHousePanel';
import { PageHeader } from '@/components/PageHeader';

export default function GrInHousePage() {
  return (
    <PageHeader breadcrumb="Misafir İlişkileri > In House List" title="In House List" description="Konaklayan misafirler — misafir ilişkileri görünümü.">
      <GuestRelationsTabs />
      <GrInHousePanel />
    </PageHeader>
  );
}
