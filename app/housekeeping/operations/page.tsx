import { PageHeader } from '@/components/PageHeader';
import { HousekeepingTabs } from '@/components/HousekeepingTabs';
import { HkOperationsHubClient } from '@/components/housekeeping/HkOperationsHub';

export const metadata = {
  title: 'HK Operasyon Merkezi',
  description: 'Housekeeping & Operations Hub — oda atama ve katçı raporu',
};

export default function HkOperationsPage() {
  return (
    <PageHeader
      breadcrumb="Kat Hizmetleri > Operasyon Merkezi"
      title="Housekeeping & Operations Hub"
      description="Mockup HK Liste v2 — oda atama, katçı raporu, arıza ve misafir talepleri tek ekranda."
    >
      <HousekeepingTabs />
      <HkOperationsHubClient />
    </PageHeader>
  );
}
