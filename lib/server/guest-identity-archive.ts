import { createHash } from 'crypto';
import type { GuestArchiveEntry } from '@/lib/egm/guest-archive';
import { splitGuestName, type EgmGender, type EgmIdType } from '@/lib/egm/types';
import { maskBirthDate, maskEmail, maskGuestName, maskIdNo, maskPhone } from '@/lib/kvkk/mask';
import { appendAuditLog } from '@/lib/server/audit-log';
import { getInvoices, init } from '@/lib/server/pms-store';
import { DEFAULT_PROPERTY_ID } from '@/lib/server/property-context';
import { prisma } from '@/lib/server/prisma';

export type GuestIdentityArchiveInput = {
  guestName: string;
  firstName?: string;
  lastName?: string;
  email?: string;
  phone?: string;
  nationality: string;
  idNo: string;
  idType?: EgmIdType;
  birthDate?: string;
  birthPlace?: string;
  gender?: EgmGender | '';
  fatherName?: string;
  motherName?: string;
  lastStay: string;
  reservationId?: string;
  consentPurpose?: string;
};

export type GuestArchiveListEntry = GuestArchiveEntry & {
  masked: true;
  idNoMasked: string;
};

const CONSENT_PURPOSE = 'konaklama_kimlik';

function pid(propertyId?: string) {
  return propertyId ?? DEFAULT_PROPERTY_ID;
}

export function hashIdNo(idNo: string): string {
  return createHash('sha256').update(idNo.trim().toUpperCase()).digest('hex');
}

export function retentionUntilFromStay(checkOut: string): string {
  const d = new Date(`${checkOut.slice(0, 10)}T12:00:00`);
  if (Number.isNaN(d.getTime())) {
    const fallback = new Date();
    fallback.setFullYear(fallback.getFullYear() + 2);
    return fallback.toISOString().slice(0, 10);
  }
  d.setFullYear(d.getFullYear() + 2);
  return d.toISOString().slice(0, 10);
}

// KVKK saklama süresi: süresi geçen (retentionUntil < bugün) ve henüz anonimleştirilmemiş
// kayıtları her okuma/yazma erişiminde anonimleştir — sadece arama sonuçlarından gizlemek
// yetmez, kişisel veri fiilen silinmeli/anonimleştirilmelidir (5651 modülündeki
// purgeExpired-on-read deseninin aynısı).
async function anonymizeExpiredGuestIdentities(propertyId?: string): Promise<number> {
  const prop = pid(propertyId);
  const today = new Date().toISOString().slice(0, 10);
  const now = new Date().toISOString();

  const expired = await prisma.guestIdentityArchive.findMany({
    where: { propertyId: prop, anonymizedAt: null, retentionUntil: { lt: today } },
    select: { id: true },
    take: 500,
  });
  if (expired.length === 0) return 0;

  await prisma.guestIdentityArchive.updateMany({
    where: { id: { in: expired.map((r) => r.id) } },
    data: {
      guestName: 'Anonimleştirildi',
      firstName: 'Anonim',
      lastName: '',
      email: null,
      phone: null,
      idNo: '',
      birthDate: null,
      birthPlace: null,
      gender: null,
      fatherName: null,
      motherName: null,
      anonymizedAt: now,
      updatedAt: now,
    },
  });
  return expired.length;
}

function rowToEntry(row: {
  id: string;
  guestName: string;
  firstName: string;
  lastName: string;
  email: string | null;
  phone: string | null;
  nationality: string;
  idNo: string;
  idType: string;
  birthDate: string | null;
  birthPlace: string | null;
  gender: string | null;
  fatherName: string | null;
  motherName: string | null;
  lastStay: string;
  visits: number;
}): GuestArchiveEntry {
  return {
    id: row.id,
    guestName: row.guestName,
    firstName: row.firstName,
    lastName: row.lastName,
    email: row.email ?? undefined,
    phone: row.phone ?? undefined,
    nationality: row.nationality,
    idNo: row.idNo,
    idType: (row.idType as EgmIdType) ?? 'TCKN',
    birthDate: row.birthDate ?? '',
    birthPlace: row.birthPlace ?? '',
    gender: (row.gender as EgmGender) ?? 'E',
    fatherName: row.fatherName ?? '',
    motherName: row.motherName ?? '',
    lastStay: row.lastStay,
    visits: row.visits,
    source: 'archive',
  };
}

export function maskArchiveEntry(entry: GuestArchiveEntry): GuestArchiveListEntry {
  return {
    ...entry,
    guestName: maskGuestName(entry.guestName),
    firstName: maskGuestName(entry.firstName),
    lastName: maskGuestName(entry.lastName),
    email: entry.email ? maskEmail(entry.email) : undefined,
    phone: entry.phone ? maskPhone(entry.phone) : undefined,
    idNo: maskIdNo(entry.idNo),
    idNoMasked: maskIdNo(entry.idNo),
    birthDate: entry.birthDate ? maskBirthDate(entry.birthDate) : '',
    birthPlace: entry.birthPlace ? '***' : '',
    fatherName: entry.fatherName ? maskGuestName(entry.fatherName) : '',
    motherName: entry.motherName ? maskGuestName(entry.motherName) : '',
    masked: true,
  };
}

function norm(s: string): string {
  return s.trim().toLowerCase().replace(/\s+/g, ' ');
}

function scoreEntry(
  entry: GuestArchiveEntry,
  query: { guestName?: string; idNo?: string; phone?: string; email?: string },
): number {
  const name = norm(query.guestName ?? '');
  const idNo = query.idNo?.trim() ?? '';
  const phone = (query.phone ?? '').replace(/\D/g, '');
  const email = norm(query.email ?? '');
  let score = 0;
  if (idNo && entry.idNo === idNo) score += 100;
  if (email && entry.email && norm(entry.email) === email) score += 80;
  if (phone && entry.phone && entry.phone.replace(/\D/g, '').includes(phone.slice(-8))) score += 60;
  if (name) {
    const gn = norm(entry.guestName);
    if (gn === name) score += 50;
    else if (gn.includes(name) || name.includes(gn)) score += 30;
    else {
      const { firstName, lastName } = splitGuestName(query.guestName ?? '');
      if (firstName && norm(entry.firstName).startsWith(norm(firstName))) score += 20;
      if (lastName && norm(entry.lastName) === norm(lastName)) score += 25;
    }
  }
  return score;
}

export async function upsertGuestIdentityArchive(
  propertyId: string,
  input: GuestIdentityArchiveInput,
): Promise<GuestArchiveEntry | null> {
  const idNo = input.idNo?.trim();
  if (!idNo || idNo.length < 4) return null;

  await init();
  await anonymizeExpiredGuestIdentities(propertyId).catch(() => undefined);
  const prop = pid(propertyId);
  const now = new Date().toISOString();
  const today = now.slice(0, 10);
  const hash = hashIdNo(idNo);
  const { firstName: autoFirst, lastName: autoLast } = splitGuestName(input.guestName);
  const firstName = (input.firstName ?? autoFirst).trim();
  const lastName = (input.lastName ?? autoLast).trim();
  const guestName = input.guestName.trim() || `${firstName} ${lastName}`.trim();
  const lastStay = input.lastStay.slice(0, 10) || today;
  const retentionUntil = retentionUntilFromStay(lastStay);

  const existing = await prisma.guestIdentityArchive.findUnique({
    where: { propertyId_idNoHash: { propertyId: prop, idNoHash: hash } },
  });

  const data = {
    guestName,
    firstName,
    lastName,
    email: input.email?.trim() || null,
    phone: input.phone?.trim() || null,
    nationality: input.nationality || 'TR',
    idNo,
    idType: input.idType ?? 'TCKN',
    birthDate: input.birthDate?.trim() || null,
    birthPlace: input.birthPlace?.trim() || null,
    gender: input.gender || null,
    fatherName: input.fatherName?.trim() || null,
    motherName: input.motherName?.trim() || null,
    consentAt: existing?.consentAt ?? now,
    consentPurpose: input.consentPurpose ?? CONSENT_PURPOSE,
    retentionUntil,
    lastStay,
    lastReservationId: input.reservationId ?? null,
    updatedAt: now,
    anonymizedAt: null,
  };

  const row = existing
    ? await prisma.guestIdentityArchive.update({
        where: { id: existing.id },
        data: {
          ...data,
          visits: existing.visits + 1,
        },
      })
    : await prisma.guestIdentityArchive.create({
        data: {
          ...data,
          id: `gia-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
          propertyId: prop,
          idNoHash: hash,
          visits: 1,
          createdAt: now,
        },
      });

  return rowToEntry(row);
}

export async function archiveGuestFromReservation(
  propertyId: string,
  reservation: {
    id: string;
    guestName: string;
    email?: string;
    phone?: string;
    checkOut: string;
    extraData?: Record<string, string>;
  },
): Promise<GuestArchiveEntry | null> {
  const extra = reservation.extraData ?? {};
  const idNo = String(extra.idNo ?? '').trim();
  if (!idNo) return null;

  return upsertGuestIdentityArchive(propertyId, {
    guestName: reservation.guestName,
    firstName: extra.firstName,
    lastName: extra.lastName,
    email: reservation.email ?? extra.email,
    phone: reservation.phone ?? extra.phone,
    nationality: String(extra.nationality ?? 'TR'),
    idNo,
    idType: (extra.idType as EgmIdType) ?? 'TCKN',
    birthDate: extra.birthDate,
    birthPlace: extra.birthPlace,
    gender: (extra.gender as EgmGender) ?? '',
    fatherName: extra.fatherName,
    motherName: extra.motherName,
    lastStay: reservation.checkOut,
    reservationId: reservation.id,
  });
}

export async function searchGuestIdentityArchive(
  propertyId: string,
  query: { guestName?: string; idNo?: string; phone?: string; email?: string },
): Promise<GuestArchiveListEntry[]> {
  await init();
  await anonymizeExpiredGuestIdentities(propertyId).catch(() => undefined);
  const prop = pid(propertyId);
  const today = new Date().toISOString().slice(0, 10);

  const rows = await prisma.guestIdentityArchive.findMany({
    where: {
      propertyId: prop,
      anonymizedAt: null,
      retentionUntil: { gte: today },
    },
    take: 200,
    orderBy: { updatedAt: 'desc' },
  });

  const scored = rows
    .map((row) => ({ row, entry: rowToEntry(row), score: scoreEntry(rowToEntry(row), query) }))
    .filter((x) => x.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, 8);

  // "Fatura listesi" — KVKK kimlik arşivinde tutulmaz (VUK uyarınca muhasebe
  // kayıtları daha uzun saklanır) ama burada çapraz referans olarak misafirin
  // geçmiş fatura sayısını gösteriyoruz; tam liste muhasebe modülünden açılır.
  if (scored.length > 0) {
    const invoices = await getInvoices(prop).catch(() => []);
    if (invoices.length > 0) {
      for (const x of scored) {
        const gn = norm(x.entry.guestName);
        x.entry.invoiceCount = invoices.filter(
          (inv) => (x.row.lastReservationId && inv.reservationId === x.row.lastReservationId) || norm(inv.guest) === gn,
        ).length;
      }
    }
  }

  return scored.map((x) => maskArchiveEntry(x.entry));
}

export async function revealGuestIdentityArchive(
  propertyId: string,
  archiveId: string,
  actor: string,
): Promise<GuestArchiveEntry | null> {
  await init();
  await anonymizeExpiredGuestIdentities(propertyId).catch(() => undefined);
  const prop = pid(propertyId);
  const today = new Date().toISOString().slice(0, 10);

  const row = await prisma.guestIdentityArchive.findFirst({
    where: {
      id: archiveId,
      propertyId: prop,
      anonymizedAt: null,
      retentionUntil: { gte: today },
    },
  });
  if (!row) return null;

  await appendAuditLog(
    {
      module: 'reception',
      action: 'kvkk_view_pii',
      entityType: 'guest_identity_archive',
      entityId: archiveId,
      user: actor,
      detail: `Misafir kimlik arşivi görüntülendi: ${maskGuestName(row.guestName)}`,
    },
    prop,
  );

  return rowToEntry(row);
}

export async function syncGuestArchiveFromEgm(propertyId?: string): Promise<number> {
  await init();
  const prop = pid(propertyId);
  const rows = await prisma.identityNotification.findMany({
    where: { propertyId: prop },
    orderBy: { createdAt: 'desc' },
    take: 500,
  });

  let count = 0;
  for (const r of rows) {
    if (!r.idNo?.trim()) continue;
    const entry = await upsertGuestIdentityArchive(prop, {
      guestName: r.guestName,
      firstName: r.firstName ?? undefined,
      lastName: r.lastName ?? undefined,
      nationality: r.nationality,
      idNo: r.idNo,
      idType: (r.idType as EgmIdType) ?? 'TCKN',
      birthDate: r.birthDate ?? undefined,
      birthPlace: r.birthPlace ?? undefined,
      gender: (r.gender as EgmGender) ?? '',
      fatherName: r.fatherName ?? undefined,
      motherName: r.motherName ?? undefined,
      lastStay: r.checkOut ?? r.checkIn,
      reservationId: r.reservationId ?? undefined,
    });
    if (entry) count += 1;
  }
  return count;
}
