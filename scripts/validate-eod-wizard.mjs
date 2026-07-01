#!/usr/bin/env node
/**
 * Tüm Elektra GR raporlarının rapor sihirbazında starter olarak tanımlı olduğunu doğrular.
 * Kullanım: npm run test:eod-wizard
 */
import assert from 'node:assert/strict';

const { EOD_LEGACY_REPORTS, EOD_LEGACY_CATEGORIES } = await import('../lib/reports/eod-legacy-catalog.ts');
const { EOD_LEGACY_FIELD_KEYS } = await import('../lib/reports/eod-legacy-fields.ts');
const { buildEodLegacyStarters, findEodStarterByRpr, eodWizardStarterId } = await import('../lib/reports/eod-legacy-wizard.ts');
const { moduleById } = await import('../lib/reports/field-catalog.ts');

const fieldSet = new Set(EOD_LEGACY_FIELD_KEYS);
const eod = moduleById('eod');
assert.ok(eod, 'eod module missing from field-catalog');

const starters = buildEodLegacyStarters();
assert.equal(starters.length, EOD_LEGACY_REPORTS.length, 'starter count mismatch');

const inModule = new Set(eod.starters.map((s) => s.reportCode ?? s.id));
const errors = [];

for (const report of EOD_LEGACY_REPORTS) {
  if (!findEodStarterByRpr(report.id)) {
    errors.push(`NO_STARTER ${report.id}`);
  }
  if (!inModule.has(report.id)) {
    errors.push(`NOT_IN_CATALOG ${report.id}`);
  }
  if (report.columns.length === 0) {
    errors.push(`EMPTY_COLUMNS ${report.id}`);
  }
  for (const col of report.columns) {
    if (!fieldSet.has(col)) errors.push(`UNKNOWN_FIELD ${report.id}.${col}`);
  }
  const cat = EOD_LEGACY_CATEGORIES.find((c) => c.id === report.categoryId);
  if (!cat) errors.push(`UNKNOWN_CATEGORY ${report.id}.${report.categoryId}`);
}

const starterIds = starters.map((s) => s.id);
const uniqueIds = new Set(starterIds);
if (uniqueIds.size !== starterIds.length) {
  errors.push('DUPLICATE_STARTER_IDS');
}

if (errors.length > 0) {
  console.error('EOD wizard validation FAILED:\n' + errors.join('\n'));
  process.exit(1);
}

console.log(`OK — ${EOD_LEGACY_REPORTS.length} GR raporu rapor sihirbazında (${eod.starters.length} toplam Gün Sonu şablonu)`);
for (const r of EOD_LEGACY_REPORTS) {
  console.log(`  ${r.id.padEnd(18)} ${eodWizardStarterId(r.id)}`);
}
