import { PageHeader } from '@/components/PageHeader';
import { ProductionDeployHub } from '@/components/deploy/ProductionDeployHub';
import { Button } from '@/components/ui';

export default function ProductionDeployPage() {
  return (
    <PageHeader
      breadcrumb="Sistem > Production Deploy"
      title="Production Deploy"
      description="Canlıya alma öncesi altyapı, güvenlik ve profesyonel PMS modül hazırlık kontrolü."
      actions={
        <Button variant="secondary" href="/tools/rollout">
          Rollout takibi
        </Button>
      }
    >
      <ProductionDeployHub />
    </PageHeader>
  );
}
