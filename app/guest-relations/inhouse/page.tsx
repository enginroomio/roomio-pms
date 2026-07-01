'use client';

import { GuestRelationsModuleShell } from '@/components/guest-relations/GuestRelationsModuleShell';
import { GrInHousePanel } from '@/components/guest-relations/GrInHousePanel';

export default function GrInHousePage() {
  return (
    <GuestRelationsModuleShell
      segment="In House List"
      title="In House List"
      description="Konaklayan misafirler — misafir ilişkileri görünümü."
    >
      <GrInHousePanel />
    </GuestRelationsModuleShell>
  );
}
