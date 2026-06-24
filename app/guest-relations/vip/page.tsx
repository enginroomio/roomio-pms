'use client';

import { GuestRelationsTabs } from '@/components/GuestRelationsTabs';
import { VipGuestsPanel } from '@/components/guest-relations/VipGuestsPanel';
import { PageHeader } from '@/components/PageHeader';
import { ReportToolbar } from '@/components/ReportToolbar';

export default function VipGuestsPage() {
  return (
    <PageHeader
      breadcrumb="Misafir İlişkileri > VIP Misafir Listesi"
      title="VIP Misafir Listesi"
      description="Seçilen tarih aralığında konaklayan veya konaklayacak VIP misafirler."
      actions={<ReportToolbar refreshLabel="Raporu Göster" onRefresh={() => {}} />}
    >
      <GuestRelationsTabs />
      <VipGuestsPanel />
    </PageHeader>
  );
}
