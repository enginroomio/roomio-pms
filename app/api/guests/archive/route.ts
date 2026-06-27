import { NextResponse } from 'next/server';
import { requireApiPermission } from '@/lib/auth/require-permission';
import { resolveApiUser } from '@/lib/auth/require-api-user';
import { getEgmIdentities } from '@/lib/server/pms-store';
import { propertyIdFromRequest } from '@/lib/server/property-context';
import { searchGuestArchive, type GuestArchiveEntry } from '@/lib/egm/guest-archive';
import { searchGuestArchiveFromDb } from '@/lib/egm/guest-archive-db';
import {
  maskArchiveEntry,
  revealGuestIdentityArchive,
  searchGuestIdentityArchive,
  syncGuestArchiveFromEgm,
  upsertGuestIdentityArchive,
} from '@/lib/server/guest-identity-archive';
import type { EgmGender, EgmIdType } from '@/lib/egm/types';
import { logApiError } from '@/lib/server/api-error';

export const dynamic = 'force-dynamic';

let syncOnce = false;

export async function GET(req: Request) {
  const auth = await requireApiPermission(req, 'identity.read');
  if (auth instanceof NextResponse) return auth;

  const url = new URL(req.url);
  const guestName = url.searchParams.get('guestName') ?? undefined;
  const idNo = url.searchParams.get('idNo') ?? undefined;
  const phone = url.searchParams.get('phone') ?? undefined;
  const email = url.searchParams.get('email') ?? undefined;

  const propertyId = propertyIdFromRequest(req);

  if (!syncOnce) {
    syncOnce = true;
    void syncGuestArchiveFromEgm(propertyId).catch(() => undefined);
  }

  const kvkkHits = await searchGuestIdentityArchive(propertyId, { guestName, idNo, phone, email });

  const egmRecords = await getEgmIdentities(propertyId);
  const egmHits = egmRecords
    .filter((r) => {
      if (idNo && r.idNo === idNo) return true;
      if (guestName && r.guestName.toLowerCase().includes(guestName.toLowerCase())) return true;
      return false;
    })
    .map((r) =>
      maskArchiveEntry({
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
        source: 'egm',
      }),
    );

  const archiveHits =
    process.env.NODE_ENV === 'production'
      ? []
      : searchGuestArchive({ guestName, idNo, phone, email }).map(maskArchiveEntry);

  const dbHits = (await searchGuestArchiveFromDb(propertyId, { guestName, idNo, phone, email })).map(maskArchiveEntry);

  const seen = new Set<string>();
  const merged = [...kvkkHits, ...egmHits, ...dbHits, ...archiveHits].filter((item) => {
    const key = item.idNoMasked || item.guestName;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });

  return NextResponse.json({
    ok: true,
    results: merged.slice(0, 8),
    kvkk: true,
    retentionNote: 'Kimlik verileri çıkış + 2 yıl saklanır; erişim denetim günlüğüne yazılır.',
  });
}

export async function POST(req: Request) {
  const propertyId = propertyIdFromRequest(req);
  const user = await resolveApiUser(req);
  if (!user) return NextResponse.json({ error: 'Yetkisiz' }, { status: 401 });

  try {
    const body = (await req.json()) as {
      action?: 'apply' | 'upsert';
      archiveId?: string;
      identity?: {
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
      };
    };

    if (body.action === 'apply') {
      const auth = await requireApiPermission(req, 'identity.read');
      if (auth instanceof NextResponse) return auth;
      if (!body.archiveId) return NextResponse.json({ error: 'archiveId required' }, { status: 400 });

      let entry: GuestArchiveEntry | null = null;
      if (body.archiveId.startsWith('gia-')) {
        entry = await revealGuestIdentityArchive(propertyId, body.archiveId, user.name);
      } else if (body.archiveId.startsWith('egm-')) {
        const egmId = body.archiveId.replace(/^egm-/, '');
        const records = await getEgmIdentities(propertyId);
        const r = records.find((x) => x.id === egmId);
        if (r) {
          entry = {
            id: body.archiveId,
            guestName: r.guestName,
            firstName: r.firstName ?? '',
            lastName: r.lastName ?? '',
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
            source: 'egm',
          };
        }
      }

      if (!entry) return NextResponse.json({ error: 'Kayıt bulunamadı veya saklama süresi dolmuş' }, { status: 404 });
      return NextResponse.json({ ok: true, entry });
    }

    if (body.action === 'upsert') {
      const auth = await requireApiPermission(req, 'identity.notify');
      if (auth instanceof NextResponse) return auth;
      if (!body.identity?.idNo) return NextResponse.json({ error: 'identity.idNo required' }, { status: 400 });
      const entry = await upsertGuestIdentityArchive(propertyId, body.identity);
      return NextResponse.json({ ok: true, entry });
    }

    return NextResponse.json({ error: 'unknown action' }, { status: 400 });
  } catch (err) {
    logApiError('POST /api/guests/archive', err);
    return NextResponse.json({ error: 'failed' }, { status: 500 });
  }
}
