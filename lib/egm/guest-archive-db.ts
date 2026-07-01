import type { GuestArchiveEntry } from '@/lib/egm/guest-archive';
import { splitGuestName } from '@/lib/egm/types';
import { getAllReservationsServer, getInvoices } from '@/lib/server/pms-store';

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

  const byKey = new Map<string, {
    guestName: string;
    email?: string;
    phone?: string;
    visits: number;
    lastStay: string;
    idNo?: string;
    nationality?: string;
    idType?: string;
    birthDate?: string;
    birthPlace?: string;
    gender?: string;
    fatherName?: string;
    motherName?: string;
    firstName?: string;
    lastName?: string;
    reservationIds: Set<string>;
  }>();

  for (const r of reservations) {
    if (r.status === 'CANCELLED') continue;
    const extra = r.extraData ?? {};
    const rid = String(extra.idNo ?? '').trim();
    const key = rid || norm(r.guestName) || r.email || r.phone || r.id;
    const existing = byKey.get(key);
    if (existing) {
      existing.visits += 1;
      existing.reservationIds.add(r.id);
      if (r.checkOut > existing.lastStay) existing.lastStay = r.checkOut;
      if (!existing.idNo && rid) existing.idNo = rid;
      if (!existing.nationality && extra.nationality) existing.nationality = String(extra.nationality);
      if (!existing.birthDate && extra.birthDate) existing.birthDate = String(extra.birthDate);
      if (!existing.birthPlace && extra.birthPlace) existing.birthPlace = String(extra.birthPlace);
      if (!existing.fatherName && extra.fatherName) existing.fatherName = String(extra.fatherName);
      if (!existing.motherName && extra.motherName) existing.motherName = String(extra.motherName);
    } else {
      byKey.set(key, {
        guestName: r.guestName,
        email: r.email,
        phone: r.phone,
        visits: 1,
        lastStay: r.checkOut,
        idNo: rid || undefined,
        nationality: extra.nationality ? String(extra.nationality) : undefined,
        idType: extra.idType ? String(extra.idType) : undefined,
        birthDate: extra.birthDate ? String(extra.birthDate) : undefined,
        birthPlace: extra.birthPlace ? String(extra.birthPlace) : undefined,
        gender: extra.gender ? String(extra.gender) : undefined,
        fatherName: extra.fatherName ? String(extra.fatherName) : undefined,
        motherName: extra.motherName ? String(extra.motherName) : undefined,
        firstName: extra.firstName ? String(extra.firstName) : undefined,
        lastName: extra.lastName ? String(extra.lastName) : undefined,
        reservationIds: new Set([r.id]),
      });
    }
  }

  const scored: Array<{ entry: GuestArchiveEntry; score: number; reservationIds: Set<string> }> = [];

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
      reservationIds: agg.reservationIds,
      entry: {
        id: `db-${key.slice(0, 24)}`,
        guestName: agg.guestName,
        firstName: agg.firstName ?? firstName,
        lastName: agg.lastName ?? lastName,
        email: agg.email,
        phone: agg.phone,
        nationality: agg.nationality ?? 'TR',
        idNo: agg.idNo ?? '',
        idType: (agg.idType as GuestArchiveEntry['idType']) ?? 'TCKN',
        birthDate: agg.birthDate ?? '',
        birthPlace: agg.birthPlace ?? '',
        gender: (agg.gender as GuestArchiveEntry['gender']) ?? 'E',
        fatherName: agg.fatherName ?? '',
        motherName: agg.motherName ?? '',
        lastStay: agg.lastStay,
        visits: agg.visits,
        source: 'archive',
      },
    });
  }

  const top = scored.sort((a, b) => b.score - a.score).slice(0, 8);

  // "Fatura listesi" — KVKK arşivinde tutulmuyor (VUK gereği muhasebe kayıtları
  // daha uzun saklanır) ama misafirin geçmiş faturalarını burada çapraz referans
  // olarak göstermek staff'ın aynı ekrandan görmesini sağlar.
  if (top.length > 0) {
    const invoices = await getInvoices(propertyId).catch(() => []);
    if (invoices.length > 0) {
      for (const x of top) {
        const gn = norm(x.entry.guestName);
        x.entry.invoiceCount = invoices.filter(
          (inv) => (inv.reservationId && x.reservationIds.has(inv.reservationId)) || norm(inv.guest) === gn,
        ).length;
      }
    }
  }

  return top.map((x) => x.entry);
}
