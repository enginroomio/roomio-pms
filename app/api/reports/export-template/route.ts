import { NextResponse } from 'next/server';
import { buildTemplateCsv, buildTemplatePdf } from '@/lib/server/template-export';
import { propertyIdFromRequest } from '@/lib/server/property-context';
import { hasPermission } from '@/lib/auth/roles';
import { resolveApiUser } from '@/lib/auth/require-api-user';

export const dynamic = 'force-dynamic';

function safeFilename(name: string): string {
  return name.replace(/[^\w\s-ğüşıöçĞÜŞİÖÇ]/g, '').replace(/\s+/g, '-').slice(0, 60) || 'rapor';
}

export async function GET(req: Request) {
  const propertyId = propertyIdFromRequest(req);
  const user = await resolveApiUser(req);
  if (!user) return NextResponse.json({ error: 'Yetkisiz' }, { status: 401 });
  if (!hasPermission(user, 'reports.export')) {
    return NextResponse.json({ error: 'Yetkisiz — reports.export gerekli' }, { status: 403 });
  }

  const { searchParams } = new URL(req.url);
  const templateId = searchParams.get('templateId');
  const format = searchParams.get('format') ?? 'pdf';
  if (!templateId) {
    return NextResponse.json({ error: 'templateId required' }, { status: 400 });
  }

  try {
    if (format === 'csv') {
      const result = await buildTemplateCsv(templateId, propertyId);
      if (!result) return NextResponse.json({ error: 'Şablon bulunamadı' }, { status: 404 });
      return new NextResponse(result.csv, {
        headers: {
          'Content-Type': 'text/csv; charset=utf-8',
          'Content-Disposition': `attachment; filename="${safeFilename(result.name)}.csv"`,
        },
      });
    }

    if (format === 'pdf') {
      const result = await buildTemplatePdf(templateId, propertyId);
      if (!result) return NextResponse.json({ error: 'Şablon bulunamadı' }, { status: 404 });
      return new NextResponse(new Uint8Array(result.pdf), {
        headers: {
          'Content-Type': 'application/pdf',
          'Content-Disposition': `attachment; filename="${safeFilename(result.name)}.pdf"`,
        },
      });
    }

    return NextResponse.json({ error: 'format must be csv or pdf' }, { status: 400 });
  } catch {
    return NextResponse.json({ error: 'export failed' }, { status: 500 });
  }
}
