import { getLoyaltyAccountByEmail } from '@/lib/loyalty/service';
import { loadLoyaltyConfig } from '@/lib/integrations/loyalty/client';
import { DEFAULT_PROPERTY_ID } from '@/lib/server/property-context';
import { prisma } from '@/lib/server/prisma';
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
  return visits >= 2 ? 'Bronze' : 'Yeni';
}

export type GuestStayRecord = {
  reservationId: string;
  refNo: string;
  checkIn: string;
  checkOut: string;
  roomType: string;
  roomNo?: string;
  status: string;
  agency: string;
  rate: number;
  currency: string;
  nights: number;
};

export type GuestProfile360 = {
  guestName: string;
  email?: string;
  phone?: string;
  visits: number;
  totalNights: number;
  totalSpend: number;
  currency: string;
  segment: string;
  isVip: boolean;
  vipLevel?: string;
  lastStay?: string;
  stays: GuestStayRecord[];
  traces: number;
  complaints: number;
  reviews: number;
  preferences: string[];
  loyalty?: {
    tierName: string;
    points: number;
    discountPercent: number;
  };
};

function matchesQuery(
  r: { guestName: string; email?: string | null; phone?: string | null; refNo?: string },
  q: string,
): boolean {
  const needle = q.toLowerCase().trim();
  if (!needle) return false;
  if (r.guestName.toLowerCase().includes(needle)) return true;
  if (r.email?.toLowerCase().includes(needle)) return true;
  if (r.phone?.includes(needle)) return true;
  if (r.refNo?.toLowerCase().includes(needle)) return true;
  return false;
}

export async function getGuestProfile360(
  query: string,
  propertyId?: string,
): Promise<GuestProfile360 | null> {
  const q = query.trim();
  if (q.length < 2) return null;

  await init();
  const prop = pid(propertyId);
  const reservations = await getAllReservationsServer(prop);
  const matched = reservations.filter((r) => matchesQuery(r, q));
  if (!matched.length) return null;

  const primary = matched[0]!;
  const guestName = primary.guestName;
  const email = primary.email ?? matched.find((r) => r.email)?.email;
  const phone = primary.phone ?? matched.find((r) => r.phone)?.phone;

  const allForGuest = reservations.filter((r) => {
    if (email && r.email && r.email.toLowerCase() === email.toLowerCase()) return true;
    return r.guestName.toLowerCase() === guestName.toLowerCase();
  });

  const completed = allForGuest.filter((r) =>
    r.status === 'CHECKED_IN' || r.status === 'CHECKED_OUT',
  );
  const visits = completed.length;
  const totalNights = completed.reduce((s, r) => s + nightsBetween(r.checkIn, r.checkOut), 0);
  const lastStay = completed
    .map((r) => r.checkIn)
    .sort()
    .reverse()[0];

  const reservationIds = allForGuest.map((r) => r.id);
  const folioRows = reservationIds.length
    ? await prisma.folioLine.findMany({
        where: { propertyId: prop, reservationId: { in: reservationIds } },
      })
    : [];
  const totalSpend = folioRows.reduce((s, l) => s + l.amount, 0);

  const vipRow = await prisma.vipGuest.findFirst({
    where: {
      propertyId: prop,
      guestName: { contains: guestName },
    },
  });

  const [traces, complaints, reviews] = await Promise.all([
    prisma.guestTrace.count({
      where: { propertyId: prop, guest: { contains: guestName } },
    }),
    prisma.guestComplaint.count({
      where: { propertyId: prop, guest: { contains: guestName } },
    }),
    prisma.guestReview.count({
      where: { propertyId: prop, guestName: { contains: guestName } },
    }),
  ]);

  const preferences: string[] = [];
  if (vipRow) preferences.push(`VIP ${vipRow.level}`);
  for (const r of allForGuest) {
    if (r.notes && !preferences.includes(r.notes)) preferences.push(r.notes);
  }

  const stays: GuestStayRecord[] = allForGuest
    .sort((a, b) => b.checkIn.localeCompare(a.checkIn))
    .slice(0, 12)
    .map((r) => ({
      reservationId: r.id,
      refNo: r.refNo,
      checkIn: r.checkIn,
      checkOut: r.checkOut,
      roomType: r.roomType,
      roomNo: r.roomNo ?? undefined,
      status: r.status,
      agency: r.agency,
      rate: r.rate,
      currency: r.currency,
      nights: nightsBetween(r.checkIn, r.checkOut),
    }));

  let loyalty: GuestProfile360['loyalty'];
  if (email) {
    const loyaltyConfig = await loadLoyaltyConfig();
    if (loyaltyConfig.enabled) {
      const account = await getLoyaltyAccountByEmail(email, prop);
      if (account) {
        const tier = loyaltyConfig.tiers.find((t) => t.id === account.tierId);
        loyalty = {
          tierName: account.tierName,
          points: account.points,
          discountPercent: tier?.discountPercent ?? 0,
        };
      }
    }
  }

  return {
    guestName,
    email,
    phone,
    visits,
    totalNights,
    totalSpend,
    currency: primary.currency,
    segment: segmentForVisits(visits),
    isVip: Boolean(vipRow),
    vipLevel: vipRow?.level ?? undefined,
    lastStay,
    stays,
    traces,
    complaints,
    reviews,
    preferences: preferences.slice(0, 8),
    loyalty,
  };
}

export async function searchGuestProfiles(
  query: string,
  propertyId?: string,
  limit = 8,
): Promise<Array<{ guestName: string; email?: string; visits: number; lastStay?: string }>> {
  const q = query.trim().toLowerCase();
  if (q.length < 2) return [];

  await init();
  const prop = pid(propertyId);
  const reservations = await getAllReservationsServer(prop);
  const byKey = new Map<string, { guestName: string; email?: string; visits: number; lastStay: string }>();

  for (const r of reservations) {
    if (!matchesQuery(r, q)) continue;
    const key = (r.email ?? r.guestName).toLowerCase();
    const existing = byKey.get(key);
    if (!existing) {
      byKey.set(key, {
        guestName: r.guestName,
        email: r.email,
        visits: r.status === 'CHECKED_IN' || r.status === 'CHECKED_OUT' ? 1 : 0,
        lastStay: r.checkIn,
      });
    } else {
      if (r.status === 'CHECKED_IN' || r.status === 'CHECKED_OUT') existing.visits += 1;
      if (r.checkIn > existing.lastStay) existing.lastStay = r.checkIn;
      if (!existing.email && r.email) existing.email = r.email;
    }
  }

  return [...byKey.values()]
    .sort((a, b) => b.visits - a.visits || b.lastStay.localeCompare(a.lastStay))
    .slice(0, limit)
    .map(({ guestName, email, visits, lastStay }) => ({
      guestName,
      email,
      visits,
      lastStay,
    }));
}
