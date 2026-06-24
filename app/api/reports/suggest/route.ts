import { NextResponse } from 'next/server';
import { requireApiPermission } from '@/lib/auth/require-permission';
import { suggestReportFromPrompt } from '@/lib/reports/ai-suggest';

export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  const auth = await requireApiPermission(req, 'reports.export');
  if (auth instanceof NextResponse) return auth;

  try {
    const body = (await req.json()) as { prompt?: string };
    const prompt = body.prompt?.trim() ?? '';
    if (prompt.length < 3) {
      return NextResponse.json({ error: 'En az 3 karakter yazın' }, { status: 400 });
    }
    const suggestion = suggestReportFromPrompt(prompt);
    return NextResponse.json({ ok: true, suggestion });
  } catch {
    return NextResponse.json({ error: 'Öneri oluşturulamadı' }, { status: 500 });
  }
}
