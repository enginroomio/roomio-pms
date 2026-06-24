'use client';

import { DashboardBoard } from '@/components/DashboardBoard';
import { DashboardKpiStrip } from '@/components/DashboardKpiStrip';
import { DashboardWelcome } from '@/components/DashboardWelcome';
import { OperationsAlertStrip } from '@/components/OperationsAlertStrip';
import { QuickActions } from '@/components/QuickActions';
import { PropertyPortfolioStrip } from '@/components/property/PropertyPortfolioStrip';
import { useProperty } from '@/components/property/PropertyProvider';
import { useDashboardSnapshot } from '@/lib/client/use-dashboard-snapshot';
import type { DashboardSnapshot } from '@/lib/server/dashboard-data';

type Props = {
  initial: DashboardSnapshot;
};

export function DashboardHome({ initial }: Props) {
  const { activeProperty } = useProperty();
  const { snapshot, loading, propertyId } = useDashboardSnapshot(initial);

  return (
    <div className={loading ? 'roomio-dashboard--loading' : undefined} data-property={activeProperty?.code}>
      <DashboardWelcome
        arrivals={snapshot.arrivals.length}
        departures={snapshot.departures.length}
        inHouse={snapshot.inHouse}
        occupancy={snapshot.occupancy}
        cleanVacant={snapshot.cleanVacant}
        dirtyVacant={snapshot.dirtyVacant}
        propertyName={activeProperty?.name}
        totalRooms={activeProperty?.totalRooms ?? snapshot.totalRooms}
        businessDate={snapshot.businessDate}
      />

      <PropertyPortfolioStrip />

      <OperationsAlertStrip />

      <QuickActions />

      <DashboardKpiStrip
        occupancy={snapshot.occupancy}
        arrivals={snapshot.arrivals.length}
        departures={snapshot.departures.length}
        inHouse={snapshot.inHouse}
        totalRooms={activeProperty?.totalRooms ?? snapshot.totalRooms}
      />

      <DashboardBoard
        key={propertyId}
        reservations={snapshot.reservations}
        businessDate={snapshot.businessDate}
        hkMap={snapshot.hkMap}
        arrivals={snapshot.arrivals}
        departures={snapshot.departures}
      />
    </div>
  );
}
