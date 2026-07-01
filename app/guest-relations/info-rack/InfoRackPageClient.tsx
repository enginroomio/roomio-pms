'use client';

import { GuestRelationsModuleShell } from '@/components/guest-relations/GuestRelationsModuleShell';
import { InfoRackPanel } from '@/components/guest-relations/InfoRackPanel';

export default function InfoRackPageClient() {
  return (
    <GuestRelationsModuleShell
      segment="Info Rack"
      title="Info Rack (İsim Listesi)"
      description="Resepsiyon isim panosu — unvan ve dil bilgisi."
    >
      <InfoRackPanel />
    </GuestRelationsModuleShell>
  );
}
