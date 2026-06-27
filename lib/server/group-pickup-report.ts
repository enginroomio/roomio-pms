import { DEFAULT_PROPERTY_ID } from '@/lib/server/property-context';
import { getGroupAllotmentStatusServer, getReservationGroupsServer } from '@/lib/server/group-reservations';
import { getBusinessDate, getProperty, init } from '@/lib/server/pms-store';

export type GroupPickupRow = {
  groupId: string;
  refNo: string;
  name: string;
  checkIn: string;
  checkOut: string;
  roomCount: number;
  memberCount: number;
  totalAllotted: number;
  totalPickedUp: number;
  pickupPct: number;
  allotment: Record<string, number>;
  pickedUp: Record<string, number>;
  remaining: Record<string, number>;
};

export type GroupPickupReport = {
  businessDate: string;
  hotel: string;
  generatedAt: string;
  rows: GroupPickupRow[];
  totals: {
    groups: number;
    roomsAllotted: number;
    roomsPickedUp: number;
    pickupPct: number;
  };
};

function pid(propertyId?: string) {
  return propertyId ?? DEFAULT_PROPERTY_ID;
}

export async function getGroupPickupReportServer(propertyId?: string): Promise<GroupPickupReport> {
  await init();
  const prop = pid(propertyId);
  const businessDate = await getBusinessDate(prop);
  const hotel = (await getProperty(prop))?.name ?? 'Hotel';
  const groups = await getReservationGroupsServer(prop);

  const rows: GroupPickupRow[] = [];
  for (const g of groups) {
    const status = await getGroupAllotmentStatusServer(g.id, prop);
    if (!status) continue;
    const pickupPct = status.totalAllotted > 0
      ? Math.round((status.totalPickedUp / status.totalAllotted) * 100)
      : 0;
    rows.push({
      groupId: g.id,
      refNo: g.refNo,
      name: g.name,
      checkIn: g.checkIn,
      checkOut: g.checkOut,
      roomCount: g.roomCount,
      memberCount: g.memberCount ?? status.totalPickedUp,
      totalAllotted: status.totalAllotted,
      totalPickedUp: status.totalPickedUp,
      pickupPct,
      allotment: status.allotment,
      pickedUp: status.pickedUp,
      remaining: status.remaining,
    });
  }

  const roomsAllotted = rows.reduce((s, r) => s + r.totalAllotted, 0);
  const roomsPickedUp = rows.reduce((s, r) => s + r.totalPickedUp, 0);

  return {
    businessDate,
    hotel,
    generatedAt: new Date().toISOString().replace('T', ' ').slice(0, 19),
    rows,
    totals: {
      groups: rows.length,
      roomsAllotted,
      roomsPickedUp,
      pickupPct: roomsAllotted > 0 ? Math.round((roomsPickedUp / roomsAllotted) * 100) : 0,
    },
  };
}
