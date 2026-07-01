import { NextResponse } from 'next/server';
import { requireComplianceExportRead } from '@/lib/auth/require-permission';
import { getAuditLogsServer } from '@/lib/server/audit-log';
import { propertyIdFromRequest } from '@/lib/server/property-context';

// TGA/TİS korumalı saklama: bu raporlara kimin ne zaman eriştiğinin audit kaydı.
// Görüntüleme sadece sistem yöneticisi içindir (requireComplianceExportRead).
export async function GET(req: Request) {
  const auth = await requireComplianceExportRead(req);
  if (auth instanceof NextResponse) return auth;

  const propertyId = propertyIdFromRequest(req);
  const url = new URL(req.url);
  const limit = url.searchParams.get('limit') ? Number(url.searchParams.get('limit')) : 200;

  const logs = (await getAuditLogsServer(propertyId, { module: 'reports', limit })).filter(
    (l) => l.action === 'compliance_report_export' || l.action === 'compliance_auto_submit',
  );

  return NextResponse.json({ logs });
}
