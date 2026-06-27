import type { RepeatGuest } from '@/lib/data/guest-relations';
import { DEFAULT_PROPERTY_ID } from '@/lib/server/property-context';
import { getAllReservationsServer, init } from '@/lib/server/pms-store';

function pid(propertyId?: string) {
  return propertyId ?? DEFAULT_PROPERTY_ID;
}

function nightsBetween(checkIn: string, checkOut: string): number {
  const a = new Date(checkIn).getTime();
  const b = new Date(checkOut).getTime();
  if (!Number.isFinite(a) || !Number.isFinite(b)) return 1;
  return Math.max(1, Math.round((b - a) / 86_400_000));
}

function segmentForVisits(visits: number): string {
  if (visits >= 7) return 'Platinum';
  if (visits >= 5) return 'Gold';
  if (visits >= 3) return 'Silver';
  return 'Bronze';
}

export async function getRepeatGuestsReportServer(propertyId?: string): Promise<RepeatGuest[]> {
  await init();
  const reservations = await getAllReservationsServer(pid(propertyId));
  const completed = reservations.filter((r) =>
    r.status === 'CHECKED_IN' || r.status === 'CHECKED_OUT',
  );

  const byGuest = new Map<string, {
    guestName: string;
    email?: string;
    visits: number;
    lastStay: string;
    totalNights: number;
  }>();

  for (const r of completed) {
    const key = (r.email ?? r.guestName).toLowerCase().trim();
    const nights = nightsBetween(r.checkIn, r.checkOut);
    const existing = byGuest.get(key);
    if (!existing) {
      byGuest.set(key, {
        guestName: r.guestName,
        email: r.email,
        visits: 1,
        lastStay: r.checkIn,
        totalNights: nights,
      });
    } else {
      existing.visits += 1;
      existing.totalNights += nights;
      if (r.checkIn > existing.lastStay) existing.lastStay = r.checkIn;
      if (!existing.email && r.email) existing.email = r.email;
    }
  }

  return [...byGuest.values()]
    .filter((g) => g.visits >= 2)
    .sort((a, b) => b.visits - a.visits || b.totalNights - a.totalNights)
    .map((g, i) => ({
      id: `rg-${i + 1}`,
      guestName: g.guestName,
      visits: g.visits,
      lastStay: g.lastStay,
      totalNights: g.totalNights,
      segment: segmentForVisits(g.visits),
      email: g.email,
    }));
}
