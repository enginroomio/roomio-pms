import { NextResponse } from 'next/server';
import { requireApiAuth, requireApiPermission } from '@/lib/auth/require-permission';
import { deleteReportTemplate, getReportTemplates, saveReportTemplate } from '@/lib/server/pms-store';
import { propertyIdFromRequest } from '@/lib/server/property-context';
import { logApiError } from '@/lib/server/api-error';

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  const auth = await requireApiAuth(req);
  if (auth instanceof NextResponse) return auth;

  const propertyId = propertyIdFromRequest(req);
  const url = new URL(req.url);
  const kind = url.searchParams.get('kind') as 'report' | 'form' | null;
  const pageId = url.searchParams.get('pageId');
  if (pageId) {
    const { getFormTemplateForPage } = await import('@/lib/server/pms-store');
    const tpl = await getFormTemplateForPage(pageId, propertyId);
    return NextResponse.json({ ok: true, template: tpl });
  }
  const templates = await getReportTemplates(propertyId, kind ?? undefined);
  return NextResponse.json({ ok: true, templates });
}

export async function POST(req: Request) {
  const auth = await requireApiPermission(req, 'reports.export');
  if (auth instanceof NextResponse) return auth;

  const propertyId = propertyIdFromRequest(req);
  try {
    const body = (await req.json()) as {
      id?: string; name: string; module: string; columns: string[];
      kind?: 'report' | 'form'; pageId?: string; layout?: unknown;
    };
    if (!body.name || !body.module) {
      return NextResponse.json({ error: 'name and module required' }, { status: 400 });
    }
    const saved = await saveReportTemplate({
      ...body,
      layout: body.layout as import('@/lib/forms/form-catalog').FormLayout | undefined,
    }, propertyId);
    return NextResponse.json({ ok: true, template: saved });
  } catch (err) {
    logApiError('POST /api/reports/templates', err);
    return NextResponse.json({ error: 'save failed' }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  const auth = await requireApiPermission(req, 'reports.export');
  if (auth instanceof NextResponse) return auth;

  const propertyId = propertyIdFromRequest(req);
  const url = new URL(req.url);
  const id = url.searchParams.get('id');
  if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 });
  const ok = await deleteReportTemplate(id, propertyId);
  return NextResponse.json({ ok });
}
