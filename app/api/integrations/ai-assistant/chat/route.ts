import { NextResponse } from 'next/server';
import { askAiAssistant } from '@/lib/integrations/ai-assistant/client';

export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  const body = (await req.json()) as { message?: string; audience?: 'guest' | 'staff' };
  if (!body.message?.trim()) {
    return NextResponse.json({ ok: false, reply: '', message: 'message gerekli' }, { status: 400 });
  }
  return NextResponse.json(await askAiAssistant(body.message, body.audience ?? 'guest'));
}
