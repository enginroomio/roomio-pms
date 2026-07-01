'use client';

import { GuestRelationsModuleShell } from '@/components/guest-relations/GuestRelationsModuleShell';
import { FacilityBookingsPanel } from '@/components/guest-relations/FacilityBookingsPanel';

export default function TennisReservationPage() {
  return (
    <GuestRelationsModuleShell
      segment="Tenis Kort Rezervasyon"
      title="Tenis Kort Rezervasyon"
      description="Tenis kortu rezervasyon takibi."
    >
      <FacilityBookingsPanel kind="tennis" title="Tenis Kort" />
    </GuestRelationsModuleShell>
  );
}
