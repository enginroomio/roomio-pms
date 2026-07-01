'use client';

import { ReceptionModuleShell } from '@/components/reception/ReceptionModuleShell';
import { QueueRoomsPanel } from '@/components/reception/QueueRoomsPanel';

export default function QueueRoomsPage() {
  return (
    <ReceptionModuleShell
      segment="Oda Bekleme Kuyruğu"
      title="Oda Bekleme Kuyruğu"
      description="Opera Queue Rooms — oda hazır olana kadar misafirleri öncelik sırasıyla yönetin."
    >
      <QueueRoomsPanel />
    </ReceptionModuleShell>
  );
}
