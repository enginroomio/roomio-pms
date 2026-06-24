import { NextResponse } from 'next/server';
import { requireApiPermission } from '@/lib/auth/require-permission';
import { getHkRoutesServer, getRoomsByRouteServer, saveHkRouteServer } from '@/lib/server/hk-routing';
import { propertyIdFromRequest } from '@/lib/server/property-context';

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  const auth = await requireApiPermission(req, 'hk.manage');
  if (auth instanceof NextResponse) return auth;

  const propertyId = propertyIdFromRequest(req);
  const { searchParams } = new URL(req.url);
  const routeCode = searchParams.get('route');

  try {
    if (routeCode) {
      const rooms = await getRoomsByRouteServer(routeCode, propertyId);
      return NextResponse.json({ ok: true, route: routeCode, rooms });
    }
    const routes = await getHkRoutesServer(propertyId);
    return NextResponse.json({ ok: true, routes });
  } catch {
    return NextResponse.json({ error: 'hk routes fetch failed' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  const auth = await requireApiPermission(req, 'hk.manage');
  if (auth instanceof NextResponse) return auth;

  const propertyId = propertyIdFromRequest(req);
  const body = (await req.json()) as {
    code?: string;
    name?: string;
    floors?: number[];
    staffName?: string;
    active?: boolean;
  };
  if (!body.code || !body.name || !body.floors?.length) {
    return NextResponse.json({ error: 'code, name, floors gerekli' }, { status: 400 });
  }
  try {
    const route = await saveHkRouteServer({
      code: body.code,
      name: body.name,
      floors: body.floors,
      staffName: body.staffName,
      active: body.active ?? true,
    }, propertyId);
    return NextResponse.json({ ok: true, route });
  } catch {
    return NextResponse.json({ error: 'save failed' }, { status: 500 });
  }
}
