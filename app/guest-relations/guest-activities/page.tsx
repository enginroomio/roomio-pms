'use client';

import { GuestRelationsTabs } from '@/components/GuestRelationsTabs';
import { GuestActivitiesPanel } from '@/components/guest-relations/GuestActivitiesPanel';
import { PageHeader } from '@/components/PageHeader';

export default function GuestActivitiesPage() {
  return (
    <PageHeader breadcrumb="Misafir İlişkileri > Misafir Aktivite Listesi" title="Misafir Aktivite Listesi" description="Misafir bazlı özel aktivite ve CRM kayıtları.">
      <GuestRelationsTabs />
      <GuestActivitiesPanel />
    </PageHeader>
  );
}
