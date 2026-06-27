'use client';

import { GuestRelationsTabs } from '@/components/GuestRelationsTabs';
import { LostFoundPanel } from '@/components/guest-relations/LostFoundPanel';
import { PageHeader } from '@/components/PageHeader';

export default function LostFoundPage() {
  return (
    <PageHeader breadcrumb="Misafir İlişkileri > Kayıp ve Bulunan Listesi" title="Kayıp ve Bulunan Listesi" description="Kayıp eşya ve buluntu takibi.">
      <GuestRelationsTabs />
      <LostFoundPanel />
    </PageHeader>
  );
}
