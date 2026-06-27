import type { EgmGender, EgmIdType } from '@/lib/egm/types';
import { splitGuestName } from '@/lib/egm/types';

export type GuestArchiveEntry = {
  id: string;
  guestName: string;
  firstName: string;
  lastName: string;
  email?: string;
  phone?: string;
  nationality: string;
  idNo: string;
  idType: EgmIdType;
  birthDate: string;
  birthPlace: string;
  gender: EgmGender;
  fatherName: string;
  motherName: string;
  lastStay: string;
  visits: number;
  source: 'archive' | 'egm';
};

/** Misafir arşivi — önceki konaklamalardan EGM kimlik kayıtları */
export const GUEST_ARCHIVE: GuestArchiveEntry[] = [
  {
    id: 'arc-zeynep',
    guestName: 'Zeynep Ak',
    firstName: 'Zeynep',
    lastName: 'Ak',
    email: 'zeynep.ak@email.com',
    phone: '+90 532 111 2233',
    nationality: 'TR',
    idNo: '12345678901',
    idType: 'TCKN',
    birthDate: '1992-07-08',
    birthPlace: 'İstanbul',
    gender: 'K',
    fatherName: 'Mehmet',
    motherName: 'Ayşe',
    lastStay: '2026-05-10',
    visits: 3,
    source: 'archive',
  },
  {
    id: 'arc-marco',
    guestName: 'Marco Rossi',
    firstName: 'Marco',
    lastName: 'Rossi',
    email: 'marco.rossi@email.it',
    phone: '+39 333 4455667',
    nationality: 'IT',
    idNo: 'YA1234567',
    idType: 'PASSPORT',
    birthDate: '1985-03-12',
    birthPlace: 'Roma',
    gender: 'E',
    fatherName: 'Giuseppe',
    motherName: 'Maria',
    lastStay: '2026-06-16',
    visits: 5,
    source: 'archive',
  },
  {
    id: 'arc-james',
    guestName: 'James Miller',
    firstName: 'James',
    lastName: 'Miller',
    phone: '+1 555 0102',
    nationality: 'US',
    idNo: 'P12345678',
    idType: 'PASSPORT',
    birthDate: '1978-11-22',
    birthPlace: 'Chicago',
    gender: 'E',
    fatherName: 'Robert',
    motherName: 'Linda',
    lastStay: '2026-06-16',
    visits: 2,
    source: 'archive',
  },
  {
    id: 'arc-anna',
    guestName: 'Anna Schmidt',
    firstName: 'Anna',
    lastName: 'Schmidt',
    email: 'anna.s@corp.de',
    nationality: 'DE',
    idNo: 'C01X00T47',
    idType: 'PASSPORT',
    birthDate: '1990-04-15',
    birthPlace: 'Berlin',
    gender: 'K',
    fatherName: 'Hans',
    motherName: 'Petra',
    lastStay: '2026-04-20',
    visits: 4,
    source: 'archive',
  },
];

function norm(s: string): string {
  return s.trim().toLowerCase().replace(/\s+/g, ' ');
}

export function searchGuestArchive(query: {
  guestName?: string;
  idNo?: string;
  phone?: string;
  email?: string;
}): GuestArchiveEntry[] {
  const name = norm(query.guestName ?? '');
  const idNo = query.idNo?.trim() ?? '';
  const phone = (query.phone ?? '').replace(/\D/g, '');
  const email = norm(query.email ?? '');

  if (!name && !idNo && !phone && !email) return [];

  const scored = GUEST_ARCHIVE.map((entry) => {
    let score = 0;
    if (idNo && entry.idNo === idNo) score += 100;
    if (email && entry.email && norm(entry.email) === email) score += 80;
    if (phone && entry.phone && entry.phone.replace(/\D/g, '').includes(phone.slice(-8))) score += 60;
    if (name) {
      const en = norm(entry.guestName);
      if (en === name) score += 50;
      else if (en.includes(name) || name.includes(en)) score += 30;
      else {
        const { firstName, lastName } = splitGuestName(query.guestName ?? '');
        if (firstName && norm(entry.firstName).startsWith(norm(firstName))) score += 20;
        if (lastName && norm(entry.lastName) === norm(lastName)) score += 25;
      }
    }
    return { entry, score };
  }).filter((x) => x.score > 0);

  return scored
    .sort((a, b) => b.score - a.score)
    .map((x) => x.entry)
    .slice(0, 5);
}

export function archiveToFormValues(entry: GuestArchiveEntry): Record<string, string> {
  return {
    guestName: entry.guestName,
    firstName: entry.firstName,
    lastName: entry.lastName,
    email: entry.email ?? '',
    phone: entry.phone ?? '',
    nationality: entry.nationality,
    idNo: entry.idNo,
    idType: entry.idType,
    birthDate: entry.birthDate,
    birthPlace: entry.birthPlace,
    gender: entry.gender,
    fatherName: entry.fatherName,
    motherName: entry.motherName,
    archiveId: entry.id,
  };
}
