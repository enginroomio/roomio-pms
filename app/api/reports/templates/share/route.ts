import { NextResponse } from 'next/server';
import { getReportTemplates, saveReportTemplate } from '@/lib/server/pms-store';
import { propertyIdFromRequest } from '@/lib/server/property-context';

export const dynamic = 'force-dynamic';

/** Şablonu mevcut otelden diğer otellere kopyalar. */
export async function POST(req: Request) {
  const sourcePropertyId = propertyIdFromRequest(req);
  const body = (await req.json()) as {
    templateId?: string;
    targetPropertyIds?: string[];
  };

  if (!body.templateId || !Array.isArray(body.targetPropertyIds) || body.targetPropertyIds.length === 0) {
    return NextResponse.json({ error: 'templateId ve targetPropertyIds gerekli' }, { status: 400 });
  }

  const templates = await getReportTemplates(sourcePropertyId);
  const source = templates.find((t) => t.id === body.templateId);
  if (!source) {
    return NextResponse.json({ error: 'Şablon bulunamadı' }, { status: 404 });
  }

  const copied: string[] = [];
  for (const targetPropertyId of body.targetPropertyIds) {
    if (targetPropertyId === sourcePropertyId) continue;
    const saved = await saveReportTemplate(
      {
        name: source.name,
        module: source.module,
        columns: source.columns,
        kind: source.kind,
        pageId: source.pageId,
        layout: source.layout,
      },
      targetPropertyId,
    );
    copied.push(saved.id);
  }

  return NextResponse.json({ ok: true, copied, count: copied.length });
}
