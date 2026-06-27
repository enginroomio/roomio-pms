import { HousekeepingMobileClient } from '@/components/housekeeping/HousekeepingMobile';
import { buildHkMobileAlerts } from '@/lib/housekeeping/alerts';
import { getDashboardSnapshot } from '@/lib/server/dashboard-data';

export const metadata = {
  title: 'Roomio HK Mobil',
  description: 'Kat hizmetleri mobil pano — çevrimdışı destekli',
};

export default async function HousekeepingMobilePage() {
  const snapshot = await getDashboardSnapshot();

  return (
    <HousekeepingMobileClient
      snapshot={{
        businessDate: snapshot.businessDate,
        reservations: snapshot.reservations,
        hkMap: snapshot.hkMap,
        arrivals: snapshot.arrivals,
        departures: snapshot.departures,
        alerts: buildHkMobileAlerts(snapshot.hkMap, snapshot.departures.length),
      }}
    />
  );
}
