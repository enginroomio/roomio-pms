import { NextResponse } from 'next/server';
import { requireKurulusApiRead, requireKurulusApiWrite } from '@/lib/auth/require-permission';
import { getAgencyByCodeServer, getAgencyContractsServer, saveAgencyContractServer } from '@/lib/server/agency-contracts';
import { propertyIdFromRequest } from '@/lib/server/property-context';
import { logApiError } from '@/lib/server/api-error';

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  const auth = await requireKurulusApiRead(req);
  if (auth instanceof NextResponse) return auth;

  const propertyId = propertyIdFromRequest(req);
  const { searchParams } = new URL(req.url);
  const code = searchParams.get('code');

  try {
    if (code) {
      const agency = await getAgencyByCodeServer(code, propertyId);
      return NextResponse.json({ ok: true, agency });
    }
    const agencies = await getAgencyContractsServer(propertyId, searchParams.get('all') !== '1');
    return NextResponse.json({ ok: true, agencies });
  } catch (err) {
    logApiError('GET /api/agencies', err);
    return NextResponse.json({ error: 'agencies fetch failed' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  const auth = await requireKurulusApiWrite(req);
  if (auth instanceof NextResponse) return auth;

  const propertyId = propertyIdFromRequest(req);
  const body = (await req.json()) as {
    code?: string;
    name?: string;
    commission?: number;
    contractEnd?: string;
    market?: string;
    active?: boolean;
  };
  if (!body.code || !body.name || body.commission == null) {
    return NextResponse.json({ error: 'code, name, commission gerekli' }, { status: 400 });
  }
  try {
    const agency = await saveAgencyContractServer({
      code: body.code,
      name: body.name,
      commission: body.commission,
      contractEnd: body.contractEnd,
      market: body.market,
      active: body.active ?? true,
    }, propertyId);
    return NextResponse.json({ ok: true, agency });
  } catch (err) {
    logApiError('POST /api/agencies', err);
    return NextResponse.json({ error: 'save failed' }, { status: 500 });
  }
}
