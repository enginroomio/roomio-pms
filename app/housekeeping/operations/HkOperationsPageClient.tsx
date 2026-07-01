'use client';

import { HousekeepingModuleShell } from '@/components/housekeeping/HousekeepingModuleShell';
import { HkOperationsHubClient } from '@/components/housekeeping/HkOperationsHub';

export default function HkOperationsPageClient() {
  return (
    <HousekeepingModuleShell
      segment="Operasyon Merkezi"
      title="Housekeeping & Operations Hub"
      description="Mockup HK Liste v2 — oda atama, katçı raporu, arıza ve misafir talepleri tek ekranda."
    >
      <HkOperationsHubClient />
    </HousekeepingModuleShell>
  );
}
