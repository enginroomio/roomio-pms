import { PageHeader } from '@/components/PageHeader';
import { HousekeepingTabs } from '@/components/HousekeepingTabs';
import { HousekeepingHubClient } from '@/components/housekeeping/HousekeepingScreens';
import { getHousekeepingBoardServer } from '@/lib/server/housekeeping-service';

export default async function HousekeepingHubPage() {
  const board = await getHousekeepingBoardServer();

  return (
    <PageHeader
      breadcrumb="Kat Hizmetleri"
      title="Housekeeping Pano"
      description="Mockup pms-menu-05-kat-hk — kat sekmeleri, mini grid, görevli paneli."
    >
      <HousekeepingTabs />
      <HousekeepingHubClient initialBoard={board} />
    </PageHeader>
  );
}
