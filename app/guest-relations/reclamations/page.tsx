'use client';

import { GuestRelationsModuleShell } from '@/components/guest-relations/GuestRelationsModuleShell';
import { ReclamationsPanel } from '@/components/guest-relations/ReclamationsPanel';

export default function ReclamationsPage() {
  return (
    <GuestRelationsModuleShell
      segment="Reklamasyon"
      title="Reklamasyon"
      description="Misafir tazminat ve reklamasyon süreç takibi."
    >
      <ReclamationsPanel />
    </GuestRelationsModuleShell>
  );
}
