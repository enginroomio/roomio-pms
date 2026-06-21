import { NextResponse } from 'next/server';
import { getEgmIdentities, sendEgmIdentity, upsertEgmIdentity } from '@/lib/server/pms-store';
import { propertyIdFromRequest } from '@/lib/server/property-context';
import { getDemoSession, hasPermission } from '@/lib/auth/roles';
import type { EgmIdentityForm } from '@/lib/egm/types';

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  const propertyId = propertyIdFromRequest(req);
  const records = await getEgmIdentities(propertyId);
  return NextResponse.json({ ok: true, records });
}

export async function POST(req: Request) {
  const propertyId = propertyIdFromRequest(req);
  const user = getDemoSession();
  if (!hasPermission(user, 'identity.notify')) {
    return NextResponse.json({ error: 'Yetkisiz' }, { status: 403 });
  }

  try {
    const body = (await req.json()) as { action?: 'send'; id?: string; form?: EgmIdentityForm };
    if (body.action === 'send' && body.id) {
      const record = await sendEgmIdentity(body.id);
      if (!record) return NextResponse.json({ error: 'Gönderilemedi — eksik alan veya kayıt yok' }, { status: 400 });
      return NextResponse.json({ ok: true, record });
    }
    if (!body.form) return NextResponse.json({ error: 'form required' }, { status: 400 });
    const record = await upsertEgmIdentity(body.form, propertyId);
    return NextResponse.json({ ok: true, record });
  } catch {
    return NextResponse.json({ error: 'failed' }, { status: 500 });
  }
}
