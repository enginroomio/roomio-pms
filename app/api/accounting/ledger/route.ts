import { NextResponse } from 'next/server';
import { addLedgerEntry, getLedgerEntries } from '@/lib/server/pms-store';
import { propertyIdFromRequest } from '@/lib/server/property-context';
import { getDemoSession, hasPermission } from '@/lib/auth/roles';
import { tokenFromRequest, verifyToken } from '@/lib/auth/jwt';

export const dynamic = 'force-dynamic';

async function authUser(req: Request) {
  const token = tokenFromRequest(req);
  if (!token) return getDemoSession('fo_manager');
  const payload = await verifyToken(token);
  return payload ? getDemoSession(payload.role) : getDemoSession('fo_manager');
}

export async function GET(req: Request) {
  const propertyId = propertyIdFromRequest(req);
  const entries = await getLedgerEntries(propertyId);
  return NextResponse.json({ ok: true, entries });
}

export async function POST(req: Request) {
  const propertyId = propertyIdFromRequest(req);
  const user = await authUser(req);
  if (!hasPermission(user, 'accounting.write')) {
    return NextResponse.json({ error: 'Yetkisiz' }, { status: 403 });
  }
  try {
    const body = (await req.json()) as {
      date: string;
      account: string;
      description: string;
      debit: number;
      credit: number;
      ref?: string;
    };
    const entry = await addLedgerEntry(body, propertyId);
    return NextResponse.json({ ok: true, entry });
  } catch {
    return NextResponse.json({ error: 'failed' }, { status: 500 });
  }
}
