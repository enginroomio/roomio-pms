import { PageHeader } from '@/components/PageHeader';
import { LoyaltyHub } from '@/components/loyalty/LoyaltyHub';
import { Button } from '@/components/ui';

export default function LoyaltyPage() {
  return (
    <PageHeader
      breadcrumb="Misafir İlişkileri > Sadakat"
      title="Sadakat Programı"
      description="Opera / Fidelio uyumlu misafir puanları, kademe indirimleri, acente bonusları ve işlem geçmişi."
      actions={
        <Button variant="secondary" href="/settings/integrations/loyalty">
          Ayarlar
        </Button>
      }
    >
      <LoyaltyHub />
    </PageHeader>
  );
}
