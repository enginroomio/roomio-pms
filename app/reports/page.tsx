import { ReportsPageClient } from './ReportsPageClient';

type Props = {
  searchParams: Promise<{ tab?: string; category?: string; report?: string; action?: string }>;
};

export default async function ReportsPage({ searchParams }: Props) {
  const params = await searchParams;
  return (
    <ReportsPageClient
      tab={params.tab ?? null}
      category={params.category ?? null}
      action={params.action ?? null}
    />
  );
}
