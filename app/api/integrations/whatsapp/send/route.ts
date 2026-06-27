import { NextResponse } from 'next/server';
import { requireIntegrationAdminWrite } from '@/lib/auth/require-permission';
import { sendWhatsappMessage } from '@/lib/integrations/whatsapp/client';

export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  const auth = await requireIntegrationAdminWrite(req);
  if (auth instanceof NextResponse) return auth;

  const body = (await req.json()) as { to?: string; template?: string; variables?: Record<string, string> };
  if (!body.to?.trim() || !body.template?.trim()) {
    return NextResponse.json({ ok: false, message: 'to ve template gerekli' }, { status: 400 });
  }

  return NextResponse.json(await sendWhatsappMessage(body.to, body.template, body.variables));
}
