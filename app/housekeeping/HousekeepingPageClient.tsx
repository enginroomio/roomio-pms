'use client';

import { useSearchParams } from 'next/navigation';
import { HousekeepingModuleShell } from '@/components/housekeeping/HousekeepingModuleShell';
import { HousekeepingHubClient } from '@/components/housekeeping/HousekeepingScreens';
import { KatHizmetleriHubPanel } from '@/components/housekeeping/KatHizmetleriHubPanel';
import type { HousekeepingBoardRow } from '@/lib/rooms/inventory';

export function HousekeepingPageClient({ initialBoard }: { initialBoard: HousekeepingBoardRow[] }) {
  const searchParams = useSearchParams();
  const hub = searchParams.get('hub');

  if (hub === 'kat') {
    return (
      <HousekeepingModuleShell
        segment="Merkezi"
        title="Kat Hizmetleri Merkezi"
        description="Oda rack, housekeeping operasyonları ve HK raporları."
      >
        <KatHizmetleriHubPanel />
      </HousekeepingModuleShell>
    );
  }

  return (
    <HousekeepingModuleShell
      segment="Pano"
      title="Housekeeping Pano"
      description="Mockup pms-menu-05-kat-hk — kat sekmeleri, mini grid, görevli paneli."
    >
      <HousekeepingHubClient initialBoard={initialBoard} />
    </HousekeepingModuleShell>
  );
}
