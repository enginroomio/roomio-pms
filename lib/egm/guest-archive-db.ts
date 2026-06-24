import type { GuestArchiveEntry } from '@/lib/egm/guest-archive';
import { splitGuestName } from '@/lib/egm/types';
import { getAllReservationsServer } from '@/lib/server/pms-store';

function norm(s: string): string {
  return s.trim().toLowerCase().replace(/\s+/g, ' ');
}

/** Önceki rezervasyonlardan misafir arşivi (Fidelio / Opera tarzı) */
export async function searchGuestArchiveFromDb(
  propertyId: string,
  query: { guestName?: string; idNo?: string; phone?: string; email?: string },
): Promise<GuestArchiveEntry[]> {
  const reservations = await getAllReservationsServer(propertyId);
  const name = norm(query.guestName ?? '');
  const idNo = query.idNo?.trim() ?? '';
  const phone = (query.phone ?? '').replace(/\D/g, '');
  const email = norm(query.email ?? '');

  if (!name && !idNo && !phone && !email) return [];

  const byKey = new Map<string, { guestName: string; email?: string; phone?: string; visits: number; lastStay: string; idNo?: string }>();

  for (const r of reservations) {
    if (r.status === 'CANCELLED') continue;
    const extra = r.extraData ?? {};
    const rid = extra.idNo ?? '';
    const key = rid || norm(r.guestName) || r.email || r.phone || r.id;
    const existing = byKey.get(key);
    if (existing) {
      existing.visits += 1;
      if (r.checkOut > existing.lastStay) existing.lastStay = r.checkOut;
    } else {
      byKey.set(key, {
        guestName: r.guestName,
        email: r.email,
        phone: r.phone,
        visits: 1,
        lastStay: r.checkOut,
        idNo: rid || undefined,
      });
    }
  }

  const scored: Array<{ entry: GuestArchiveEntry; score: number }> = [];

  for (const [key, agg] of byKey) {
    let score = 0;
    if (idNo && agg.idNo === idNo) score += 100;
    if (email && agg.email && norm(agg.email) === email) score += 80;
    if (phone && agg.phone && agg.phone.replace(/\D/g, '').includes(phone.slice(-8))) score += 60;
    if (name) {
      const gn = norm(agg.guestName);
      if (gn === name) score += 50;
      else if (gn.includes(name) || name.includes(gn)) score += 30;
      else {
        const { firstName, lastName } = splitGuestName(query.guestName ?? '');
        const parts = gn.split(' ');
        if (firstName && parts[0]?.startsWith(norm(firstName))) score += 20;
        if (lastName && parts.includes(norm(lastName))) score += 25;
      }
    }
    if (score <= 0) continue;

    const { firstName, lastName } = splitGuestName(agg.guestName);
    scored.push({
      score,
      entry: {
        id: `db-${key.slice(0, 24)}`,
        guestName: agg.guestName,
        firstName,
        lastName,
        email: agg.email,
        phone: agg.phone,
        nationality: 'TR',
        idNo: agg.idNo ?? '',
        idType: 'TCKN',
        birthDate: '',
        birthPlace: '',
        gender: 'E',
        fatherName: '',
        motherName: '',
        lastStay: agg.lastStay,
        visits: agg.visits,
        source: 'archive',
      },
    });
  }

  return scored
    .sort((a, b) => b.score - a.score)
    .map((x) => x.entry)
    .slice(0, 8);
}
