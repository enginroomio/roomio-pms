import { DEFAULT_PROPERTY_ID } from '@/lib/server/property-context';
import { prisma } from '@/lib/server/prisma';

export async function seedReservationGroupsIfEmpty(): Promise<boolean> {
  const count = await prisma.reservationGroup.count({ where: { propertyId: DEFAULT_PROPERTY_ID } });
  if (count > 0) return false;

  await prisma.reservationGroup.create({
    data: {
      id: 'grp-tech-summit',
      propertyId: DEFAULT_PROPERTY_ID,
      refNo: 'GRP-2026-001',
      name: 'Tech Summit 2026',
      contactName: 'Events Team',
      checkIn: '2026-09-10',
      checkOut: '2026-09-14',
      roomCount: 25,
      status: 'confirmed',
      allotmentJson: JSON.stringify({ DBL: 18, SUI: 5, TRP: 2 }),
      createdAt: '2026-06-01',
    },
  });
  return true;
}
