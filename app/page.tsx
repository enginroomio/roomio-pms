import { DashboardHome } from '@/components/DashboardHome';
import { HomeScreenShell } from '@/components/HomeScreenShell';
import { getDashboardSnapshot } from '@/lib/server/dashboard-data';

export default async function HomePage() {
  const snapshot = await getDashboardSnapshot();

  return (
    <HomeScreenShell>
      <DashboardHome initial={snapshot} />
    </HomeScreenShell>
  );
}
