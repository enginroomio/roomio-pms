'use client';

import { GuestRelationsModuleShell } from '@/components/guest-relations/GuestRelationsModuleShell';
import { GuestActivitiesPanel } from '@/components/guest-relations/GuestActivitiesPanel';

export default function GuestActivitiesPage() {
  return (
    <GuestRelationsModuleShell
      segment="Misafir Aktivite"
      title="Misafir Aktivite Listesi"
      description="Misafir bazlı özel aktivite ve CRM kayıtları."
    >
      <GuestActivitiesPanel />
    </GuestRelationsModuleShell>
  );
}
