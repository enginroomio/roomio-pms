'use client';

import { GuestRelationsModuleShell } from '@/components/guest-relations/GuestRelationsModuleShell';
import { DailyActivitiesPanel } from '@/components/guest-relations/DailyActivitiesPanel';

export default function DailyActivitiesPage() {
  return (
    <GuestRelationsModuleShell
      segment="Günlük Aktivite"
      title="Günlük Aktivite Listesi"
      description="İş günü departman aktivite günlüğü — Fidelio GR daily log."
    >
      <DailyActivitiesPanel />
    </GuestRelationsModuleShell>
  );
}
