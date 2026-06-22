import { DailyMovements } from '@/components/DailyMovements';
import { DashboardKpiStrip } from '@/components/DashboardKpiStrip';
import { DashboardWelcome } from '@/components/DashboardWelcome';
import { QuickActions } from '@/components/QuickActions';
import { DashboardRoomRack } from '@/components/DashboardRoomRack';
import { getDashboardSnapshot } from '@/lib/server/dashboard-data';

export default async function HomePage() {
  const snapshot = await getDashboardSnapshot();

  const dndCount = Object.values(snapshot.hkMap).filter((r) => r.hkStatus === 'DND').length;
  const oooCount = Object.values(snapshot.hkMap).filter((r) => r.hkStatus === 'OOO' || r.hkStatus === 'OOS').length;

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

      <div className="roomio-dashboard-board">
        <div className="roomio-dashboard-rack">
          <DashboardRoomRack
            reservations={snapshot.reservations}
            businessDate={snapshot.businessDate}
            hkMap={snapshot.hkMap}
          />
        </div>
        <DailyMovements
          arrivals={snapshot.arrivals}
          departures={snapshot.departures}
          alerts={[
            { label: 'DND Odalar', count: dndCount, href: '/housekeeping/rooms' },
            { label: 'Bakım / OOO', count: oooCount, href: '/housekeeping/rooms' },
            { label: 'Bugün çıkış', count: snapshot.departures.length, href: '/reception/departures' },
          ]}
        />
      </div>
    </>
  );
}
