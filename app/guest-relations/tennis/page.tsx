'use client';

import { GuestRelationsTabs } from '@/components/GuestRelationsTabs';
import { FacilityBookingsPanel } from '@/components/guest-relations/FacilityBookingsPanel';
import { PageHeader } from '@/components/PageHeader';

export default function TennisReservationPage() {
  return (
    <PageHeader breadcrumb="Misafir İlişkileri > Tenis Kort Rezervasyon" title="Tenis Kort Rezervasyon" description="Tenis kortu rezervasyon takibi.">
      <GuestRelationsTabs />
      <FacilityBookingsPanel kind="tennis" title="Tenis" />
    </PageHeader>
  );
}
