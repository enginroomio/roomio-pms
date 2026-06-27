import { PageHeader } from '@/components/PageHeader';
import { RevenueManagementHub } from '@/components/revenue/RevenueManagementHub';

export default function RevenuePage() {
  return (
    <PageHeader
      breadcrumb="Gelir Yönetimi"
      title="Gelir Yönetimi (RMS)"
      description="Opera / Elektra uyumlu doluluk tahmini, ADR, RevPAR, kanal stratejisi ve dinamik fiyatlandırma."
    >
      <RevenueManagementHub />
    </PageHeader>
  );
}
