'use client';

import { GuestRelationsModuleShell } from '@/components/guest-relations/GuestRelationsModuleShell';
import { VipGuestsPanel } from '@/components/guest-relations/VipGuestsPanel';
import { ReportToolbar } from '@/components/ReportToolbar';

export default function VipGuestsPage() {
  return (
    <GuestRelationsModuleShell
      segment="VIP Misafirler"
      title="VIP Misafir Listesi"
      description="Seçilen tarih aralığında konaklayan veya konaklayacak VIP misafirler."
      actions={<ReportToolbar refreshLabel="Raporu Göster" onRefresh={() => {}} />}
    >
      <VipGuestsPanel />
    </GuestRelationsModuleShell>
  );
}
