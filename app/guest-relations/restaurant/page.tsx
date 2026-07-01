'use client';

import { GuestRelationsModuleShell } from '@/components/guest-relations/GuestRelationsModuleShell';
import { FacilityBookingsPanel } from '@/components/guest-relations/FacilityBookingsPanel';

export default function RestaurantReservationPage() {
  return (
    <GuestRelationsModuleShell
      segment="Restoran Rezervasyon"
      title="Restoran Rezervasyon"
      description="Misafir restoran rezervasyonları — kısayol: Shift+R"
    >
      <FacilityBookingsPanel kind="restaurant" title="Restoran" />
    </GuestRelationsModuleShell>
  );
}
