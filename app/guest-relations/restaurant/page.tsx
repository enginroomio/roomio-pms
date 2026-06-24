'use client';

import { GuestRelationsTabs } from '@/components/GuestRelationsTabs';
import { FacilityBookingsPanel } from '@/components/guest-relations/FacilityBookingsPanel';
import { PageHeader } from '@/components/PageHeader';

export default function RestaurantReservationPage() {
  return (
    <PageHeader breadcrumb="Misafir İlişkileri > Restoran Rezervasyon" title="Restoran Rezervasyon" description="Misafir restoran rezervasyonları — kısayol: Shift+R">
      <GuestRelationsTabs />
      <FacilityBookingsPanel kind="restaurant" title="Restoran" />
    </PageHeader>
  );
}
