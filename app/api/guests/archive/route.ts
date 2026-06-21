import { NextResponse } from 'next/server';
import { getEgmIdentities } from '@/lib/server/pms-store';
import { propertyIdFromRequest } from '@/lib/server/property-context';
import { searchGuestArchive, type GuestArchiveEntry } from '@/lib/egm/guest-archive';
import type { EgmGender, EgmIdType } from '@/lib/egm/types';

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  const url = new URL(req.url);
  const guestName = url.searchParams.get('guestName') ?? undefined;
  const idNo = url.searchParams.get('idNo') ?? undefined;
  const phone = url.searchParams.get('phone') ?? undefined;
  const email = url.searchParams.get('email') ?? undefined;

  const propertyId = propertyIdFromRequest(req);
  const archiveHits = searchGuestArchive({ guestName, idNo, phone, email });

  const egmRecords = await getEgmIdentities(propertyId);
  const egmHits: GuestArchiveEntry[] = egmRecords
    .filter((r) => {
      if (idNo && r.idNo === idNo) return true;
      if (guestName && r.guestName.toLowerCase().includes(guestName.toLowerCase())) return true;
      return false;
    })
    .map((r) => ({
      id: `egm-${r.id}`,
      guestName: r.guestName,
      firstName: r.firstName ?? r.guestName.split(' ')[0] ?? '',
      lastName: r.lastName ?? r.guestName.split(' ').slice(1).join(' '),
      nationality: r.nationality,
      idNo: r.idNo,
      idType: (r.idType ?? 'TCKN') as EgmIdType,
      birthDate: r.birthDate ?? '',
      birthPlace: r.birthPlace ?? '',
      gender: (r.gender ?? 'E') as EgmGender,
      fatherName: r.fatherName ?? '',
      motherName: r.motherName ?? '',
      lastStay: r.checkIn,
      visits: 1,
      source: 'egm' as const,
    }));

  const merged = [...egmHits, ...archiveHits.filter((a) => !egmHits.some((e) => e.idNo === a.idNo))];
  return NextResponse.json({ ok: true, results: merged.slice(0, 5) });
}
