import { fieldLabel } from '@/lib/reports/field-catalog';
import { buildGenericTablePdfKit } from '@/lib/server/pdf-templates';
import {
  getBusinessDate,
  getProperty,
  getReportTemplate,
} from '@/lib/server/pms-store';
import { templateDataRows } from '@/lib/server/template-data';
import { DEFAULT_PROPERTY_ID } from '@/lib/server/property-context';
import { PROPERTY } from '@/lib/navigation';

function escapeCsv(value: string | number): string {
  const s = String(value);
  if (s.includes(',') || s.includes('"') || s.includes('\n')) {
    return `"${s.replace(/"/g, '""')}"`;
  }
  return s;
}

async function hotelName(propertyId?: string): Promise<string> {
  const prop = await getProperty(propertyId ?? DEFAULT_PROPERTY_ID);
  return prop?.name ?? PROPERTY.name;
}

export async function buildTemplateCsv(templateId: string, propertyId?: string): Promise<{ csv: string; name: string } | null> {
  const tpl = await getReportTemplate(templateId, propertyId);
  if (!tpl) return null;
  const headers = tpl.columns.map((c) => fieldLabel(tpl.module, c));
  const rows = await templateDataRows(tpl, propertyId);
  const lines = [headers.map(escapeCsv).join(',')];
  for (const row of rows) {
    lines.push(row.map(escapeCsv).join(','));
  }
  return { csv: lines.join('\n'), name: tpl.name };
}

export async function buildTemplatePdf(templateId: string, propertyId?: string): Promise<{ pdf: Buffer; name: string } | null> {
  const tpl = await getReportTemplate(templateId, propertyId);
  if (!tpl) return null;
  const [hotel, businessDate, rows] = await Promise.all([
    hotelName(propertyId),
    getBusinessDate(propertyId),
    templateDataRows(tpl, propertyId),
  ]);
  const headers = tpl.columns.map((c) => fieldLabel(tpl.module, c));
  const pdf = await buildGenericTablePdfKit(tpl.name, {
    hotel,
    businessDate,
    module: tpl.module,
    generatedAt: new Date().toISOString().replace('T', ' ').slice(0, 19),
  }, headers, rows);
  return { pdf, name: tpl.name };
}
