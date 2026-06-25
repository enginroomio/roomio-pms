import { DashboardHome } from '@/components/DashboardHome';
import { getDashboardSnapshot } from '@/lib/server/dashboard-data';

export default async function HomePage() {
  const snapshot = await getDashboardSnapshot();

  return <DashboardHome initial={snapshot} />;
}
