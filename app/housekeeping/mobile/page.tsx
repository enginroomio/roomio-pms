import { HousekeepingMobileClient } from '@/components/housekeeping/HousekeepingMobile';
import { getDashboardSnapshot } from '@/lib/server/dashboard-data';

export const metadata = {
  title: 'Roomio HK Mobil',
  description: 'Kat hizmetleri mobil pano — çevrimdışı destekli',
};

export default async function HousekeepingMobilePage() {
  const snapshot = await getDashboardSnapshot();

  const dndCount = Object.values(snapshot.hkMap).filter((r) => r.hkStatus === 'DND').length;
  const oooCount = Object.values(snapshot.hkMap).filter(
    (r) => r.hkStatus === 'OOO' || r.hkStatus === 'OOS',
  ).length;

  return (
    <HousekeepingMobileClient
      snapshot={{
        businessDate: snapshot.businessDate,
        reservations: snapshot.reservations,
        hkMap: snapshot.hkMap,
        arrivals: snapshot.arrivals,
        departures: snapshot.departures,
        alerts: [
          { label: 'DND Odalar', count: dndCount, href: '/housekeeping/rooms' },
          { label: 'Bakım / OOO', count: oooCount, href: '/housekeeping/rooms' },
          { label: 'Bugün çıkış', count: snapshot.departures.length, href: '/reception/departures' },
        ],
      }}
    />
  );
}
