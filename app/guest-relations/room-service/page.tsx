'use client';

import { GuestRelationsModuleShell } from '@/components/guest-relations/GuestRelationsModuleShell';
import { RoomServiceOrdersPanel } from '@/components/guest-relations/RoomServiceOrdersPanel';

export default function RoomServiceOrdersPage() {
  return (
    <GuestRelationsModuleShell
      segment="Oda Servisi Siparişleri"
      title="Oda Servisi Siparişleri"
      description="Misafirlerin cep telefonundan verdiği oda servisi siparişleri"
    >
      <RoomServiceOrdersPanel />
    </GuestRelationsModuleShell>
  );
}
