import { EOD_LEGACY_REPORTS } from './eod-legacy-catalog';
import { renderLegacyEodReport } from './eod-legacy-render';
import type { LegacyRenderContext } from './eod-legacy-render-utils';

export type EodLegacyPackageItem = {
  id: string;
  title: string;
  businessDate: string;
  generatedAt: string;
  status: 'ready';
  lineCount: number;
};

export type EodLegacyPackage = {
  businessDate: string;
  generatedAt: string;
  reportCount: number;
  reports: EodLegacyPackageItem[];
  texts: Record<string, string>;
};

function countListedLines(text: string): number {
  const m = text.match(/Listelenen\s+(\d+)/g);
  if (!m?.length) return 0;
  const last = m[m.length - 1]!.match(/(\d+)/);
  return last ? Number(last[1]) : 0;
}

export function buildEodLegacyPackage(ctx: LegacyRenderContext): EodLegacyPackage {
  const generatedAt = ctx.generatedAt.toISOString().replace('T', ' ').slice(0, 19);
  const texts: Record<string, string> = {};
  const reports: EodLegacyPackageItem[] = [];

  for (const report of EOD_LEGACY_REPORTS) {
    const text = renderLegacyEodReport(report, ctx);
    texts[report.id] = text;
    reports.push({
      id: report.id,
      title: report.title,
      businessDate: ctx.businessDate,
      generatedAt,
      status: 'ready',
      lineCount: countListedLines(text),
    });
  }

  return {
    businessDate: ctx.businessDate,
    generatedAt,
    reportCount: reports.length,
    reports,
    texts,
  };
}

export function buildEodLegacyPackageTextBundle(pkg: EodLegacyPackage): string {
  const parts = [
    `ELEKTRA GR GÜN SONU PAKETİ`,
    `İş günü: ${pkg.businessDate}`,
    `Oluşturma: ${pkg.generatedAt}`,
    `Rapor sayısı: ${pkg.reportCount}`,
    '='.repeat(80),
    '',
  ];
  for (const report of pkg.reports) {
    parts.push(`### ${report.id} — ${report.title}`, '', pkg.texts[report.id] ?? '', '', '='.repeat(80), '');
  }
  return parts.join('\n');
}
