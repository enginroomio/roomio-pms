import { NextResponse } from 'next/server';
import { requireIntegrationAdminWrite } from '@/lib/auth/require-permission';
import { sendEdispatch } from '@/lib/integrations/e-dispatch/client';

export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  const auth = await requireIntegrationAdminWrite(req);
  if (auth instanceof NextResponse) return auth;

  const body = (await req.json()) as {
    recipient?: string;
    items?: string;
    plateNo?: string;
  };

  if (!body.recipient?.trim() || !body.items?.trim()) {
    return NextResponse.json({ ok: false, message: 'recipient ve items gerekli' }, { status: 400 });
  }

  return NextResponse.json(await sendEdispatch({
    recipient: body.recipient,
    items: body.items,
    plateNo: body.plateNo,
  }));
}
