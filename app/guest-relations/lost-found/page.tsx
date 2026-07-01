'use client';

import { GuestRelationsModuleShell } from '@/components/guest-relations/GuestRelationsModuleShell';
import { LostFoundPanel } from '@/components/guest-relations/LostFoundPanel';

export default function LostFoundPage() {
  return (
    <GuestRelationsModuleShell
      segment="Kayıp ve Bulunan"
      title="Kayıp ve Bulunan Listesi"
      description="Kayıp eşya ve buluntu takibi."
    >
      <LostFoundPanel />
    </GuestRelationsModuleShell>
  );
}
