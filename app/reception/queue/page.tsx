'use client';

import { PageHeader } from '@/components/PageHeader';
import { ReceptionTabs } from '@/components/ReceptionTabs';
import { QueueRoomsPanel } from '@/components/reception/QueueRoomsPanel';

export default function QueueRoomsPage() {
  return (
    <PageHeader
      breadcrumb="Resepsiyon > Oda Bekleme Kuyruğu"
      title="Oda Bekleme Kuyruğu"
      description="Opera Queue Rooms — oda hazır olana kadar misafirleri öncelik sırasıyla yönetin."
    >
      <ReceptionTabs />
      <QueueRoomsPanel />
    </PageHeader>
  );
}
