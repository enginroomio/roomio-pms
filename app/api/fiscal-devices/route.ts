import { NextResponse } from 'next/server';
import { requireApiAnyPermission, requireKurulusApiWrite } from '@/lib/auth/require-permission';
import {
  getFiscalDevicesServer,
  getFiscalDevicesStatusServer,
  patchFiscalDeviceActiveServer,
  pingFiscalDevicesServer,
  saveFiscalDeviceServer,
} from '@/lib/server/fiscal-devices';
import { propertyIdFromRequest } from '@/lib/server/property-context';

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  const auth = await requireApiAnyPermission(req, ['accounting.read', 'settings.admin']);
  if (auth instanceof NextResponse) return auth;

  const propertyId = propertyIdFromRequest(req);
  const { searchParams } = new URL(req.url);
  const view = searchParams.get('view');

  try {
    if (view === 'ping') {
      const ping = await pingFiscalDevicesServer(propertyId);
      return NextResponse.json({ ...ping });
    }
    if (view === 'status') {
      const devices = await getFiscalDevicesStatusServer(propertyId);
      return NextResponse.json({ ok: true, devices });
    }
    const devices = await getFiscalDevicesServer(propertyId);
    return NextResponse.json({ ok: true, devices });
  } catch {
    return NextResponse.json({ error: 'fiscal devices fetch failed' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  const auth = await requireKurulusApiWrite(req);
  if (auth instanceof NextResponse) return auth;

  const propertyId = propertyIdFromRequest(req);
  const body = (await req.json()) as {
    code?: string;
    name?: string;
    serial?: string;
    active?: boolean;
  };
  if (!body.code || !body.name || !body.serial) {
    return NextResponse.json({ error: 'code, name, serial gerekli' }, { status: 400 });
  }
  try {
    const device = await saveFiscalDeviceServer({
      code: body.code,
      name: body.name,
      serial: body.serial,
      active: body.active ?? true,
    }, propertyId);
    return NextResponse.json({ ok: true, device });
  } catch {
    return NextResponse.json({ error: 'save failed' }, { status: 500 });
  }
}

export async function PATCH(req: Request) {
  const auth = await requireApiAnyPermission(req, ['accounting.write', 'settings.admin']);
  if (auth instanceof NextResponse) return auth;

  const propertyId = propertyIdFromRequest(req);
  const body = (await req.json()) as { id?: string; active?: boolean };
  if (!body.id || body.active == null) {
    return NextResponse.json({ error: 'id ve active gerekli' }, { status: 400 });
  }
  try {
    const device = await patchFiscalDeviceActiveServer(body.id, body.active, propertyId);
    if (!device) return NextResponse.json({ error: 'Bulunamadı' }, { status: 404 });
    return NextResponse.json({ ok: true, device });
  } catch {
    return NextResponse.json({ error: 'update failed' }, { status: 500 });
  }
}
