import { NextResponse } from 'next/server';
import { requireKurulusApiRead, requireKurulusApiWrite } from '@/lib/auth/require-permission';
import { getCompaniesServer, saveCompanyServer } from '@/lib/server/companies';
import { propertyIdFromRequest } from '@/lib/server/property-context';

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  const auth = await requireKurulusApiRead(req);
  if (auth instanceof NextResponse) return auth;

  const propertyId = propertyIdFromRequest(req);
  const { searchParams } = new URL(req.url);
  try {
    const companies = await getCompaniesServer(propertyId, searchParams.get('all') !== '1');
    return NextResponse.json({ ok: true, companies });
  } catch {
    return NextResponse.json({ error: 'companies fetch failed' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  const auth = await requireKurulusApiWrite(req);
  if (auth instanceof NextResponse) return auth;

  const propertyId = propertyIdFromRequest(req);
  const body = (await req.json()) as {
    code?: string;
    name?: string;
    branch?: string;
    taxNo?: string;
    address?: string;
    contactName?: string;
    email?: string;
    phone?: string;
    creditLimit?: number;
    active?: boolean;
  };
  if (!body.code || !body.name) {
    return NextResponse.json({ error: 'code ve name gerekli' }, { status: 400 });
  }
  try {
    const company = await saveCompanyServer({
      code: body.code,
      name: body.name,
      branch: body.branch,
      taxNo: body.taxNo,
      address: body.address,
      contactName: body.contactName,
      email: body.email,
      phone: body.phone,
      creditLimit: body.creditLimit,
      active: body.active ?? true,
    }, propertyId);
    return NextResponse.json({ ok: true, company });
  } catch {
    return NextResponse.json({ error: 'save failed' }, { status: 500 });
  }
}
