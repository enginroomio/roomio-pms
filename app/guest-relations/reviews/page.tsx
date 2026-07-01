'use client';

import { GuestRelationsModuleShell } from '@/components/guest-relations/GuestRelationsModuleShell';
import { GuestReviewsPanel } from '@/components/guest-relations/GuestReviewsPanel';
import { Button } from '@/components/ui';

export default function GuestReviewsPage() {
  return (
    <GuestRelationsModuleShell
      segment="Misafir Yorumları"
      title="Misafir Yorum Listesi"
      description="Belirtilen kriterlere göre misafir yorumlarının listelendiği rapordur."
      actions={<Button href="/guest-relations/reviews/new">+ Yorum Girişi</Button>}
    >
      <GuestReviewsPanel />
    </GuestRelationsModuleShell>
  );
}
