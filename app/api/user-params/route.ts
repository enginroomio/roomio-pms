import { NextResponse } from 'next/server';
import { requireKurulusApiRead, requireKurulusApiWrite } from '@/lib/auth/require-permission';
import { getUserParamsServer, saveUserParamServer } from '@/lib/server/user-params';
import { propertyIdFromRequest } from '@/lib/server/property-context';

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  const auth = await requireKurulusApiRead(req);
  if (auth instanceof NextResponse) return auth;

  const propertyId = propertyIdFromRequest(req);
  try {
    const params = await getUserParamsServer(propertyId);
    return NextResponse.json({ ok: true, params });
  } catch {
    return NextResponse.json({ error: 'user params fetch failed' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  const auth = await requireKurulusApiWrite(req);
  if (auth instanceof NextResponse) return auth;

  const propertyId = propertyIdFromRequest(req);
  const body = (await req.json()) as { key?: string; value?: string; description?: string };
  if (!body.key || body.value == null) {
    return NextResponse.json({ error: 'key, value gerekli' }, { status: 400 });
  }
  try {
    const param = await saveUserParamServer({
      key: body.key,
      value: body.value,
      description: body.description,
    }, propertyId);
    return NextResponse.json({ ok: true, param });
  } catch {
    return NextResponse.json({ error: 'save failed' }, { status: 500 });
  }
}
