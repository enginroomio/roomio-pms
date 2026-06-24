'use client';

import { GuestRelationsTabs } from '@/components/GuestRelationsTabs';
import { DailyActivitiesPanel } from '@/components/guest-relations/DailyActivitiesPanel';
import { PageHeader } from '@/components/PageHeader';

export default function DailyActivitiesPage() {
  return (
    <PageHeader breadcrumb="Misafir İlişkileri > Günlük Aktivite Listesi" title="Günlük Aktivite Listesi" description="İş günü departman aktivite günlüğü — Fidelio GR daily log.">
      <GuestRelationsTabs />
      <DailyActivitiesPanel />
    </PageHeader>
  );
}
