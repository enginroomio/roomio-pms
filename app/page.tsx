import { DashboardBoard } from '@/components/DashboardBoard';
import { DashboardKpiStrip } from '@/components/DashboardKpiStrip';
import { DashboardWelcome } from '@/components/DashboardWelcome';
import { QuickActions } from '@/components/QuickActions';
import { getDashboardSnapshot } from '@/lib/server/dashboard-data';

export default async function HomePage() {
  const snapshot = await getDashboardSnapshot();

  return (
    <>
      <DashboardWelcome
        arrivals={snapshot.arrivals.length}
        departures={snapshot.departures.length}
        inHouse={snapshot.inHouse}
        occupancy={snapshot.occupancy}
        cleanVacant={snapshot.cleanVacant}
        dirtyVacant={snapshot.dirtyVacant}
      />

      <QuickActions />

      <DashboardKpiStrip
        occupancy={snapshot.occupancy}
        arrivals={snapshot.arrivals.length}
        departures={snapshot.departures.length}
        inHouse={snapshot.inHouse}
        totalRooms={snapshot.totalRooms}
      />

      <DashboardBoard
        reservations={snapshot.reservations}
        businessDate={snapshot.businessDate}
        hkMap={snapshot.hkMap}
        arrivals={snapshot.arrivals}
        departures={snapshot.departures}
      />
    </>
  );
}
