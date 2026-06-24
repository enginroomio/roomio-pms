import { NextResponse } from 'next/server';
import { getDashboardSnapshot } from '@/lib/server/dashboard-data';
import { propertyIdFromRequest } from '@/lib/server/property-context';
import { requireApiPermission } from '@/lib/auth/require-permission';

export async function GET(request: Request) {
  const auth = await requireApiPermission(request, 'reservations.read');
  if (auth instanceof NextResponse) return auth;

  const propertyId = propertyIdFromRequest(request);
  const snapshot = await getDashboardSnapshot(propertyId);
  return NextResponse.json(
    {
      businessDate: snapshot.businessDate,
      totalRooms: snapshot.totalRooms,
      inHouse: snapshot.inHouse,
      occupancy: snapshot.occupancy,
      arrivals: snapshot.arrivals.length,
      departures: snapshot.departures.length,
      cells: snapshot.cells.map((c) => ({
        roomNo: c.room.roomNo,
        floor: c.room.floor,
        state: c.state,
        guestName: c.guestName,
      })),
    },
    { headers: { 'Cache-Control': 'private, max-age=3, stale-while-revalidate=10' } },
  );
}
