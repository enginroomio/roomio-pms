import { NextResponse } from 'next/server';
import { requireKurulusApiRead, requireKurulusApiWrite } from '@/lib/auth/require-permission';
import { getConfigParamsServer, saveConfigParamServer } from '@/lib/server/config-params';
import { propertyIdFromRequest } from '@/lib/server/property-context';
import { logApiError } from '@/lib/server/api-error';

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  const auth = await requireKurulusApiRead(req);
  if (auth instanceof NextResponse) return auth;

  const propertyId = propertyIdFromRequest(req);
  try {
    const params = await getConfigParamsServer(propertyId);
    return NextResponse.json({ ok: true, params });
  } catch (err) {
    logApiError('GET /api/config-params', err);
    return NextResponse.json({ error: 'config params fetch failed' }, { status: 500 });
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
    const param = await saveConfigParamServer({
      key: body.key,
      value: body.value,
      description: body.description,
    }, propertyId);
    return NextResponse.json({ ok: true, param });
  } catch (err) {
    logApiError('POST /api/config-params', err);
    return NextResponse.json({ error: 'save failed' }, { status: 500 });
  }
}
