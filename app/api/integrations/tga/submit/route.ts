import { NextResponse } from 'next/server';
import { requireComplianceExportRead } from '@/lib/auth/require-permission';
import { submitTgaReport, testTgaConnection } from '@/lib/integrations/tga/client';
import { appendAuditLog } from '@/lib/server/audit-log';
import { propertyIdFromRequest } from '@/lib/server/property-context';

export async function GET(req: Request) {
  const auth = await requireComplianceExportRead(req);
  if (auth instanceof NextResponse) return auth;

  const connection = await testTgaConnection();
  return NextResponse.json({ ok: connection.ok, connection });
}

export async function POST(req: Request) {
  const auth = await requireComplianceExportRead(req);
  if (auth instanceof NextResponse) return auth;

  const propertyId = propertyIdFromRequest(req);
  const body = (await req.json()) as { businessDate?: string; reportId?: string; action?: string };

  if (body.action === 'test') {
    const connection = await testTgaConnection();
    return NextResponse.json({ ok: connection.ok, connection });
  }

  const businessDate = body.businessDate ?? new Date().toISOString().slice(0, 10);
  const result = await submitTgaReport({ businessDate, reportId: body.reportId });

  await appendAuditLog(
    {
      module: 'reports',
      action: 'compliance_report_export',
      entityType: 'tga',
      entityId: businessDate,
      user: auth.user.name,
      detail: result.message,
    },
    propertyId,
  );

  return NextResponse.json({ ok: result.ok, result });
}
