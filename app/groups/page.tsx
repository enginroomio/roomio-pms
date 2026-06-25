import { PageHeader } from '@/components/PageHeader';
import { GroupManagementHub } from '@/components/groups/GroupManagementHub';
import { Button } from '@/components/ui';

export default function GroupsPage() {
  return (
    <PageHeader
      breadcrumb="Rezervasyon > Grup & Blok"
      title="Grup & Blok Yönetimi"
      description="Opera / Fidelio uyumlu allotment, pickup takibi, release cutoff ve blok envanter yönetimi."
      actions={
        <Button variant="secondary" href="/reservations?tab=group">
          Rezervasyon sekmesi
        </Button>
      }
    >
      <GroupManagementHub />
    </PageHeader>
  );
}
