import { NextResponse } from 'next/server';
import { requireApiPermission } from '@/lib/auth/require-permission';
import { captureMessage, flushSentry, initSentry, sentryConfigured } from '@/lib/monitoring/sentry';

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  const auth = await requireApiPermission(req, 'settings.admin');
  if (auth instanceof NextResponse) return auth;

  const url = new URL(req.url);
  const test = url.searchParams.get('test') === '1';
  const configured = sentryConfigured();
  const active = initSentry();

  if (test && active) {
    captureMessage('roomio monitoring ping', 'info');
    await flushSentry();
  }

  return NextResponse.json({
    ok: true,
    sentry: {
      configured,
      active,
      detail: configured ? 'sentry:configured' : 'sentry:disabled',
    },
  });
}
