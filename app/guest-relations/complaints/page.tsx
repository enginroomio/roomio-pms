'use client';

import { GuestRelationsTabs } from '@/components/GuestRelationsTabs';
import { GuestComplaintsPanel } from '@/components/guest-relations/GuestComplaintsPanel';
import { PageHeader } from '@/components/PageHeader';

export default function ComplaintsPage() {
  return (
    <PageHeader breadcrumb="Misafir İlişkileri > Arıza ve Şikayet Listesi" title="Arıza ve Şikayet Listesi" description="Misafir şikayetleri ve teknik arıza kayıtları.">
      <GuestRelationsTabs />
      <GuestComplaintsPanel />
    </PageHeader>
  );
}
