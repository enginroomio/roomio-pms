'use client';

import { useSearchParams } from 'next/navigation';
import { PageHeader } from '@/components/PageHeader';
import { HousekeepingTabs } from '@/components/HousekeepingTabs';
import { HousekeepingHubClient } from '@/components/housekeeping/HousekeepingScreens';
import { KatHizmetleriHubPanel } from '@/components/housekeeping/KatHizmetleriHubPanel';
import type { HousekeepingBoardRow } from '@/lib/rooms/inventory';

export function HousekeepingPageClient({ initialBoard }: { initialBoard: HousekeepingBoardRow[] }) {
  const searchParams = useSearchParams();
  const hub = searchParams.get('hub');

  if (hub === 'kat') {
    return (
      <PageHeader
        breadcrumb="Kat Hizmetleri"
        title="Kat Hizmetleri Merkezi"
        description="Oda rack, housekeeping operasyonları ve HK raporları."
      >
        <HousekeepingTabs />
        <KatHizmetleriHubPanel />
      </PageHeader>
    );
  }

  return (
    <PageHeader
      breadcrumb="Kat Hizmetleri"
      title="Housekeeping Pano"
      description="Mockup pms-menu-05-kat-hk — kat sekmeleri, mini grid, görevli paneli."
    >
      <HousekeepingTabs />
      <HousekeepingHubClient initialBoard={initialBoard} />
    </PageHeader>
  );
}
