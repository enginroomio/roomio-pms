import { NextResponse } from 'next/server';
import { requireIntegrationAdminRead } from '@/lib/auth/require-permission';
import { bundleToBtkCsv, exportBtkBundle } from '@/lib/integrations/hotspot5651/server';

export async function GET(req: Request) {
  const auth = await requireIntegrationAdminRead(req);
  if (auth instanceof NextResponse) return auth;

  const url = new URL(req.url);
  const from = url.searchParams.get('from') ?? new Date(Date.now() - 30 * 86_400_000).toISOString();
  const to = url.searchParams.get('to') ?? new Date().toISOString();
  const format = url.searchParams.get('format') ?? 'json';

  const bundle = await exportBtkBundle(from, to);

  if (format === 'csv') {
    const csv = bundleToBtkCsv(bundle);
    return new NextResponse(csv, {
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="btk-5651-${bundle.exportedAt.slice(0, 10)}.csv"`,
      },
    });
  }

  return NextResponse.json(bundle);
}
