import { getAllReservationsServer, getBusinessDate } from '@/lib/server/pms-store';
import { getHkRoomMap } from '@/lib/server/housekeeping-service';
import { DEFAULT_PROPERTY_ID } from '@/lib/server/property-context';
import { buildRackCells, countRackByState } from '@/lib/rooms/inventory';
import { countTotalRooms } from '@/lib/rooms/room-config';
import type { HkRoomRecord } from '@/lib/data/hk-defaults';
import type { Reservation } from '@/lib/types/reservation';
import type { RackCell } from '@/lib/types/room';

export type DashboardSnapshot = {
  businessDate: string;
  reservations: Reservation[];
  hkMap: Record<string, HkRoomRecord>;
  cells: RackCell[];
  counts: ReturnType<typeof countRackByState>;
  totalRooms: number;
  inHouse: number;
  arrivals: Reservation[];
  departures: Reservation[];
  occupancy: number;
  cleanVacant: number;
  dirtyVacant: number;
};

function filterInHouse(reservations: Reservation[]): Reservation[] {
  return reservations.filter((r) => r.status === 'CHECKED_IN');
}

function filterTodayArrivals(reservations: Reservation[], today: string): Reservation[] {
  return reservations.filter(
    (r) => r.checkIn === today && (r.status === 'CONFIRMED' || r.status === 'OPTION'),
  );
}

function filterTodayDepartures(reservations: Reservation[], today: string): Reservation[] {
  return reservations.filter((r) => r.checkOut === today && r.status === 'CHECKED_IN');
}

export async function getDashboardSnapshot(propertyId = DEFAULT_PROPERTY_ID): Promise<DashboardSnapshot> {
  const [businessDate, reservations, hkMap] = await Promise.all([
    getBusinessDate(propertyId),
    getAllReservationsServer(propertyId),
    getHkRoomMap(propertyId),
  ]);

  const cells = buildRackCells(undefined, reservations, businessDate, hkMap);
  const counts = countRackByState(cells);
  const total = countTotalRooms();
  const inHouseList = filterInHouse(reservations);
  const inHouse = inHouseList.length;
  const occupied = counts['dolu-temiz'] + counts['dolu-kirli'] + counts.checkout;
  const occupancy = total > 0 ? Math.round((occupied / total) * 100) : 0;

  return {
    businessDate,
    reservations,
    hkMap,
    cells,
    counts,
    totalRooms: total,
    inHouse,
    arrivals: filterTodayArrivals(reservations, businessDate),
    departures: filterTodayDepartures(reservations, businessDate),
    occupancy,
    cleanVacant: counts.temiz,
    dirtyVacant: counts.kirli + counts['dolu-kirli'],
  };
}
