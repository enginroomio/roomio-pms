'use client';

import { useSearchParams } from 'next/navigation';
import { PageHeader } from '@/components/PageHeader';
import { HousekeepingTabs } from '@/components/HousekeepingTabs';
import { HkMobileTasksClient } from '@/components/housekeeping/HkMobileTasks';
import { HkChecklistPanel, HkControlArchivePanel } from '@/components/housekeeping/HkTaskPanels';

export default function HousekeepingTasksPageClient() {
  const searchParams = useSearchParams();
  const tab = searchParams.get('tab');

  if (tab === 'checklist') {
    return (
      <PageHeader
        breadcrumb="Kat Hizmetleri > Kontrol Listesi"
        title="Housekeeper Kontrol Listesi"
        description="Günlük temizlik ve kontrol görevleri."
      >
        <HousekeepingTabs />
        <HkChecklistPanel />
      </PageHeader>
    );
  }

  if (tab === 'archive') {
    return (
      <PageHeader
        breadcrumb="Kat Hizmetleri > Kontrol Arşivi"
        title="Oda Kontrol Arşiv Listesi"
        description="Tamamlanan süpervizör kontrol kayıtları."
      >
        <HousekeepingTabs />
        <HkControlArchivePanel />
      </PageHeader>
    );
  }

  return <HkMobileTasksClient />;
}
