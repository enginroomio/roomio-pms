'use client';

import { useSearchParams } from 'next/navigation';
import { HousekeepingModuleShell } from '@/components/housekeeping/HousekeepingModuleShell';
import { HkMobileTasksClient } from '@/components/housekeeping/HkMobileTasks';
import { HkChecklistPanel, HkControlArchivePanel } from '@/components/housekeeping/HkTaskPanels';

export default function HousekeepingTasksPageClient() {
  const searchParams = useSearchParams();
  const tab = searchParams.get('tab');

  if (tab === 'checklist') {
    return (
      <HousekeepingModuleShell
        segment="Kontrol Listesi"
        title="Housekeeper Kontrol Listesi"
        description="Günlük temizlik ve kontrol görevleri."
      >
        <HkChecklistPanel />
      </HousekeepingModuleShell>
    );
  }

  if (tab === 'archive') {
    return (
      <HousekeepingModuleShell
        segment="Kontrol Arşivi"
        title="Oda Kontrol Arşiv Listesi"
        description="Tamamlanan süpervizör kontrol kayıtları."
      >
        <HkControlArchivePanel />
      </HousekeepingModuleShell>
    );
  }

  return (
    <HousekeepingModuleShell
      segment="Görevler"
      title="Görevler"
      description="Kat görevleri — oda temizlik ve kontrol atamaları."
    >
      <HkMobileTasksClient embedded />
    </HousekeepingModuleShell>
  );
}
