import { GuestRelationsTabs } from '@/components/GuestRelationsTabs';
import { InfoRackPanel } from '@/components/guest-relations/InfoRackPanel';
import { PageHeader } from '@/components/PageHeader';

export default function InfoRackPage() {
  return (
    <PageHeader breadcrumb="Misafir İlişkileri > Info Rack (İsim Listesi)" title="Info Rack (İsim Listesi)" description="Resepsiyon isim panosu — unvan ve dil bilgisi.">
      <GuestRelationsTabs />
      <InfoRackPanel />
    </PageHeader>
  );
}
