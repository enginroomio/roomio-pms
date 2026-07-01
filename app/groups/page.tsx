'use client';

import { GroupManagementHub } from '@/components/groups/GroupManagementHub';
import { Button } from '@/components/ui';
import { RezervasyonModuleLayout } from '@/components/rezervasyon/RezervasyonModuleLayout';

export default function GroupsPage() {
  return (
    <RezervasyonModuleLayout
      segment="Toplu Rezervasyon"
      title="Grup & Blok Yönetimi"
      description="Opera / Fidelio uyumlu allotment, pickup takibi, release cutoff ve blok envanter yönetimi."
      menuSearch=""
      actions={
        <Button variant="secondary" href="/reservations?tab=group">
          Rezervasyon sekmesi
        </Button>
      }
    >
      <GroupManagementHub />
    </RezervasyonModuleLayout>
  );
}
