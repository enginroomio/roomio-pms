import type { EodLegacyReportDef } from './eod-legacy-catalog';
import { EOD_LEGACY_FIELD_DEFS } from './eod-legacy-fields';
import type { LegacyRenderContext } from './eod-legacy-render-utils';
import {
  pad,
  fmtFullDate,
  fmtMoney,
  reportHeader,
  reportHeaderRoomPrice,
} from './eod-legacy-render-utils';

function fieldSample(key: string): string {
  return EOD_LEGACY_FIELD_DEFS.find((f) => f.key === key)?.sample ?? '—';
}

function varySample(key: string, index: number): string {
  const base = fieldSample(key);
  if (key === 'amount' || key === 'balance' || key === 'totalAmount' || key === 'roomPrice' || key === 'folioAmount') {
    const n = [1250, 5343, 4750, 22851.64, 14080][index % 5] ?? 1000;
    return fmtMoney(n);
  }
  if (key === 'roomNo') return String(208 + index * 4);
  if (key === 'rowNo') return String(index + 1);
  if (key === 'guestName') {
    const names = ['ABDULLA ALAMERI', 'TATIANA MACHULA', 'MUSTAFA BAYBAĞAN', 'ILDAR VALIULIN', 'FATMA BIBI LAJPURIA'];
    return names[index % names.length]!;
  }
  if (key === 'agency') {
    const a = ['BOOKING-NRF', 'BOOKING.COM', 'W-INT TC', 'W.INT', 'BOOKING ÖDE'];
    return a[index % a.length]!;
  }
  if (index === 0) return base;
  return base.replace(/\d/g, (d) => String((Number(d) + index) % 10));
}

/** Rapor ID → demo satır sayısı (0 = boş liste) */
const ROW_COUNTS: Record<string, number> = {
  GR301I: 0,
  GR301S: 0,
  GR302: 0,
  GR402: 0,
  GR503: 0,
  GR602F: 0,
  GRMAIL: 0,
  GR103: 0,
  GR105: 0,
  GR202: 0,
  GR203: 2,
  GR220: 8,
  GR221: 3,
  GR300: 5,
  GR400K: 4,
  GR401K: 6,
  GR501: 6,
  GR602: 4,
  GR400: 1,
  GR401: 8,
  GR302K: 5,
  GR500: 4,
  GR501I: 6,
  GR600: 3,
  GR601: 4,
  GR701: 12,
  GRMAL: 5,
  GRMUSTERI: 6,
  GUNLUKINDIRIMIADE: 2,
};

export function demoRowCount(reportId: string): number {
  return ROW_COUNTS[reportId] ?? 3;
}

export function buildDemoRows(columns: string[], reportId: string): Record<string, string>[] {
  const count = demoRowCount(reportId);
  return Array.from({ length: count }, (_, i) => {
    const row: Record<string, string> = {};
    for (const col of columns) {
      row[col] = varySample(col, i);
    }
    return row;
  });
}

function columnWidth(key: string, label: string): number {
  if (['guestName', 'description', 'note', 'productName', 'firstName', 'lastName'].includes(key)) return 22;
  if (['agency', 'department', 'deptName', 'priceDescription'].includes(key)) return 14;
  if (label.length > 10) return 12;
  return Math.max(8, Math.min(11, label.length + 2));
}

export function renderEodColumnTable(
  ctx: LegacyRenderContext,
  title: string,
  columns: string[],
  rows: Record<string, string>[],
  options?: { useTakenDate?: boolean },
): string {
  if (columns.length === 0) {
    return [...reportHeader(ctx, title), pad('Listelenen 0', 24)].join('\n');
  }

  const labels = columns.map((k) => {
    const def = EOD_LEGACY_FIELD_DEFS.find((f) => f.key === k);
    return def?.label ?? k;
  });
  const widths = columns.map((k, i) => columnWidth(k, labels[i]!));
  const totalWidth = widths.reduce((s, w) => s + w, 0);

  const headerLine = columns.map((k, i) => pad(labels[i]!, widths[i]!)).join('');
  const headerFn = options?.useTakenDate === false ? reportHeader : reportHeaderRoomPrice;
  const lines: string[] = [...headerFn(ctx, title), headerLine, '-'.repeat(Math.min(130, totalWidth))];

  for (const row of rows) {
    lines.push(columns.map((k, i) => pad(row[k] ?? '', widths[i]!)).join(''));
  }

  lines.push('', '-'.repeat(Math.min(130, totalWidth)), pad(`Listelenen ${rows.length}`, 24));
  return lines.join('\n');
}

export function renderReportAsTable(
  report: EodLegacyReportDef,
  ctx: LegacyRenderContext,
  columns?: string[],
): string {
  const cols = columns?.length ? columns : report.columns;
  const rows = buildDemoRows(cols, report.id);
  const useTaken = !['GR400', 'GR500', 'RGC'].includes(report.id);
  return renderEodColumnTable(ctx, report.title, cols, rows, { useTakenDate: useTaken });
}
