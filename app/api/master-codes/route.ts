import { NextResponse } from 'next/server';
import { requireKurulusApiRead, requireKurulusApiWrite } from '@/lib/auth/require-permission';
import { getMasterCodesServer, saveMasterCodeServer, type MasterCodeKind } from '@/lib/server/master-codes';
import { propertyIdFromRequest } from '@/lib/server/property-context';

export const dynamic = 'force-dynamic';

const KINDS = new Set<MasterCodeKind>([
  'market', 'segment', 'source', 'department', 'meal_plan', 'nationality', 'res_type', 'revenue_group',
]);

export async function GET(req: Request) {
  const auth = await requireKurulusApiRead(req);
  if (auth instanceof NextResponse) return auth;

  const propertyId = propertyIdFromRequest(req);
  const { searchParams } = new URL(req.url);
  const kind = searchParams.get('kind') as MasterCodeKind | null;
  if (!kind || !KINDS.has(kind)) {
    return NextResponse.json({ error: 'kind=market|segment|source|department|meal_plan|nationality|res_type|revenue_group gerekli' }, { status: 400 });
  }
  try {
    const codes = await getMasterCodesServer(kind, propertyId, searchParams.get('all') !== '1');
    return NextResponse.json({ ok: true, kind, codes });
  } catch {
    return NextResponse.json({ error: 'codes fetch failed' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  const auth = await requireKurulusApiWrite(req);
  if (auth instanceof NextResponse) return auth;

  const propertyId = propertyIdFromRequest(req);
  const body = (await req.json()) as {
    kind?: MasterCodeKind;
    code?: string;
    name?: string;
    description?: string;
    active?: boolean;
  };
  if (!body.kind || !KINDS.has(body.kind) || !body.code || !body.name) {
    return NextResponse.json({ error: 'kind, code, name gerekli' }, { status: 400 });
  }
  try {
    const code = await saveMasterCodeServer(body.kind, {
      code: body.code,
      name: body.name,
      description: body.description,
      active: body.active ?? true,
    }, propertyId);
    return NextResponse.json({ ok: true, code });
  } catch {
    return NextResponse.json({ error: 'save failed' }, { status: 500 });
  }
}
