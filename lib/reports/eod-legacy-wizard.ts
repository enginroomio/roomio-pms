import { EOD_LEGACY_REPORTS, EOD_LEGACY_CATEGORIES, findLegacyReport, type EodLegacyReportDef } from './eod-legacy-catalog';
import type { ReportStarter } from './field-catalog';

export function eodWizardStarterId(reportId: string): string {
  return `eod-${reportId.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`;
}

/** Kayıtlı şablon ID — GR raporu başına sabit */
export function eodTemplateId(reportId: string): string {
  return eodWizardStarterId(reportId);
}

function categoryLabel(categoryId: string): string {
  return EOD_LEGACY_CATEGORIES.find((c) => c.id === categoryId)?.label ?? categoryId;
}

export function buildEodLegacyStarters(): ReportStarter[] {
  return EOD_LEGACY_REPORTS.map((r) => legacyReportToStarter(r));
}

function legacyReportToStarter(r: EodLegacyReportDef): ReportStarter {
  return {
    id: eodWizardStarterId(r.id),
    name: r.title,
    description: `${r.fileName} — ${r.label}`,
    columns: [...r.columns],
    reportCode: r.id,
    group: categoryLabel(r.categoryId),
  };
}

export function eodWizardDesignUrl(reportId: string): string {
  return `/reports?tab=design&rpr=${encodeURIComponent(reportId)}`;
}

export function findEodStarterByRpr(rpr: string): { starter: ReportStarter; report: EodLegacyReportDef } | undefined {
  const report = findLegacyReport(rpr);
  if (!report) return undefined;
  return { report, starter: legacyReportToStarter(report) };
}

export function findEodStarterById(starterId: string): { starter: ReportStarter; report: EodLegacyReportDef } | undefined {
  const report = EOD_LEGACY_REPORTS.find((r) => eodWizardStarterId(r.id) === starterId);
  if (!report) return undefined;
  return { report, starter: legacyReportToStarter(report) };
}
