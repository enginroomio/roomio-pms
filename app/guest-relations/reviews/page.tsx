'use client';

import { GuestRelationsTabs } from '@/components/GuestRelationsTabs';
import { GuestReviewsPanel } from '@/components/guest-relations/GuestReviewsPanel';
import { PageHeader } from '@/components/PageHeader';
import { Button } from '@/components/ui';

export default function GuestReviewsPage() {
  return (
    <PageHeader
      breadcrumb="Misafir İlişkileri > Misafir Yorum Listesi"
      title="Misafir Yorum Listesi"
      description="Belirtilen kriterlere göre misafir yorumlarının listelendiği rapordur."
      actions={<Button href="/guest-relations/reviews/new">+ Yorum Girişi</Button>}
    >
      <GuestRelationsTabs />
      <GuestReviewsPanel />
    </PageHeader>
  );
}
