import { NextResponse } from 'next/server';
import { requireKurulusApiRead, requireKurulusApiWrite } from '@/lib/auth/require-permission';
import { getPropertyBranchesServer, savePropertyBranchServer } from '@/lib/server/property-branches';
import { propertyIdFromRequest } from '@/lib/server/property-context';
import { logApiError } from '@/lib/server/api-error';

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  const auth = await requireKurulusApiRead(req);
  if (auth instanceof NextResponse) return auth;

  const propertyId = propertyIdFromRequest(req);
  try {
    const branches = await getPropertyBranchesServer(propertyId);
    return NextResponse.json({ ok: true, branches });
  } catch (err) {
    logApiError('GET /api/property-branches', err);
    return NextResponse.json({ error: 'branches fetch failed' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  const auth = await requireKurulusApiWrite(req);
  if (auth instanceof NextResponse) return auth;

  const propertyId = propertyIdFromRequest(req);
  const body = (await req.json()) as {
    code?: string;
    name?: string;
    city?: string;
    rooms?: number;
    active?: boolean;
  };
  if (!body.code || !body.name || !body.city || body.rooms == null) {
    return NextResponse.json({ error: 'code, name, city, rooms gerekli' }, { status: 400 });
  }
  try {
    const branch = await savePropertyBranchServer({
      code: body.code,
      name: body.name,
      city: body.city,
      rooms: body.rooms,
      active: body.active ?? true,
    }, propertyId);
    return NextResponse.json({ ok: true, branch });
  } catch (err) {
    logApiError('POST /api/property-branches', err);
    return NextResponse.json({ error: 'save failed' }, { status: 500 });
  }
}
