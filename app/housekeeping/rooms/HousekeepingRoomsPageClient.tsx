'use client';

import { useSearchParams } from 'next/navigation';
import { HousekeepingRoomsClient } from '@/components/housekeeping/HousekeepingScreens';
import { HkRoomControlPanel } from '@/components/housekeeping/HkRoomControlPanel';
import { HousekeepingModuleShell } from '@/components/housekeeping/HousekeepingModuleShell';

export default function HousekeepingRoomsPageClient() {
  const searchParams = useSearchParams();
  const tab = searchParams.get('tab');

  if (tab === 'control') {
    return (
      <HousekeepingModuleShell
        segment="Oda Kontrolü"
        title="House Keeping Oda Kontrolü"
        description="Temizlik sonrası süpervizör kontrol listesi — geçti/kaldı."
      >
        <HkRoomControlPanel />
      </HousekeepingModuleShell>
    );
  }

  return <HousekeepingRoomsClient />;
}
