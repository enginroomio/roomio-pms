import { NextResponse } from 'next/server';
import { requireKurulusApiRead, requireKurulusApiWrite } from '@/lib/auth/require-permission';
import { getWarehousesServer, saveWarehouseServer } from '@/lib/server/warehouses';
import { propertyIdFromRequest } from '@/lib/server/property-context';
import { logApiError } from '@/lib/server/api-error';

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  const auth = await requireKurulusApiRead(req);
  if (auth instanceof NextResponse) return auth;

  const propertyId = propertyIdFromRequest(req);
  try {
    const warehouses = await getWarehousesServer(propertyId);
    return NextResponse.json({ ok: true, warehouses });
  } catch (err) {
    logApiError('GET /api/warehouses', err);
    return NextResponse.json({ error: 'warehouses fetch failed' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  const auth = await requireKurulusApiWrite(req);
  if (auth instanceof NextResponse) return auth;

  const propertyId = propertyIdFromRequest(req);
  const body = (await req.json()) as {
    code?: string;
    name?: string;
    location?: string;
    active?: boolean;
  };
  if (!body.code || !body.name || !body.location) {
    return NextResponse.json({ error: 'code, name, location gerekli' }, { status: 400 });
  }
  try {
    const warehouse = await saveWarehouseServer({
      code: body.code,
      name: body.name,
      location: body.location,
      active: body.active ?? true,
    }, propertyId);
    return NextResponse.json({ ok: true, warehouse });
  } catch (err) {
    logApiError('POST /api/warehouses', err);
    return NextResponse.json({ error: 'save failed' }, { status: 500 });
  }
}
