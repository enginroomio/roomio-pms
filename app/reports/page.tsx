import { ReportsPageClient } from './ReportsPageClient';
import {
  reportsCategoryFromParams,
  reportsCategoryFromReportSlug,
} from '@/lib/navigation/menu-route-params';

type Props = {
  searchParams: Promise<{ tab?: string; category?: string; report?: string; action?: string; property?: string }>;
};

export default async function ReportsPage({ searchParams }: Props) {
  const params = await searchParams;
  const category =
    reportsCategoryFromParams(params.tab ?? null, params.category ?? null)
    ?? reportsCategoryFromReportSlug(params.report ?? null)
    ?? params.category
    ?? null;

  return (
    <ReportsPageClient
      tab={params.tab ?? null}
      category={category}
      action={params.action ?? null}
      report={params.report ?? null}
      propertyCode={params.property ?? null}
    />
  );
}
