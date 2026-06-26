'use client';

import { useSearchParams } from 'next/navigation';
import { HousekeepingRoomsClient } from '@/components/housekeeping/HousekeepingScreens';
import { HkRoomControlPanel } from '@/components/housekeeping/HkRoomControlPanel';
import { PageHeader } from '@/components/PageHeader';
import { HousekeepingTabs } from '@/components/HousekeepingTabs';

export default function HousekeepingRoomsPageClient() {
  const searchParams = useSearchParams();
  const tab = searchParams.get('tab');

  if (tab === 'control') {
    return (
      <PageHeader
        breadcrumb="Kat Hizmetleri > Oda Kontrolü"
        title="House Keeping Oda Kontrolü"
        description="Temizlik sonrası süpervizör kontrol listesi — geçti/kaldı."
      >
        <HousekeepingTabs />
        <HkRoomControlPanel />
      </PageHeader>
    );
  }

  return <HousekeepingRoomsClient />;
}
