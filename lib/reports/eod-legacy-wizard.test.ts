import assert from 'node:assert/strict';
import test from 'node:test';
import { EOD_LEGACY_REPORTS, EOD_LEGACY_CATEGORIES, findLegacyReport, reportsForCategory } from './eod-legacy-catalog';
import { EOD_LEGACY_FIELD_KEYS } from './eod-legacy-fields';
import {
  buildEodLegacyStarters,
  eodWizardDesignUrl,
  eodWizardStarterId,
  findEodStarterById,
  findEodStarterByRpr,
} from './eod-legacy-wizard';
import { moduleById } from './field-catalog';

test('eod legacy catalog — tam GR ağacı', () => {
  assert.ok(EOD_LEGACY_REPORTS.length >= 45);
  assert.ok(findLegacyReport('GR101'));
  assert.ok(findLegacyReport('GR222'));
  assert.ok(findLegacyReport('GRFOLYOBAKIYE2'));
  assert.ok(findLegacyReport('RGC'));
  assert.ok(findLegacyReport('GRMAIL'));
  assert.ok(findLegacyReport('GR401N'));
});

test('gunsonu-listesi — tüm raporları gösterir', () => {
  assert.equal(reportsForCategory('gunsonu-listesi').length, EOD_LEGACY_REPORTS.length);
});

test('eod wizard — her GR raporu için starter', () => {
  const starters = buildEodLegacyStarters();
  assert.equal(starters.length, EOD_LEGACY_REPORTS.length);
  const gr101 = findEodStarterByRpr('GR101');
  assert.ok(gr101);
  assert.equal(gr101?.starter.name, 'Günlük Giriş Listesi');
  assert.equal(gr101?.starter.reportCode, 'GR101');
  assert.ok(gr101!.starter.columns.includes('roomNo'));
  assert.ok(gr101!.starter.group);
});

test('eod wizard — tüm raporlar tek tek sihirbazda', () => {
  const fieldSet = new Set(EOD_LEGACY_FIELD_KEYS);
  const eod = moduleById('eod')!;
  const starterByCode = new Map(eod.starters.map((s) => [s.reportCode ?? s.id, s]));
  const ids = new Set<string>();

  for (const report of EOD_LEGACY_REPORTS) {
    const starterId = eodWizardStarterId(report.id);
    assert.ok(!ids.has(starterId), `duplicate starter id: ${starterId}`);
    ids.add(starterId);

    const byRpr = findEodStarterByRpr(report.id);
    assert.ok(byRpr, `missing findEodStarterByRpr: ${report.id}`);
    assert.equal(byRpr!.starter.id, starterId);

    const byId = findEodStarterById(starterId);
    assert.ok(byId, `missing findEodStarterById: ${starterId}`);
    assert.equal(byId!.report.id, report.id);

    const inModule = starterByCode.get(report.id);
    assert.ok(inModule, `not in field-catalog eod starters: ${report.id}`);
    assert.equal(inModule!.columns.length, report.columns.length);
    assert.deepEqual(inModule!.columns, report.columns);

    assert.ok(report.columns.length > 0, `empty columns: ${report.id}`);
    for (const col of report.columns) {
      assert.ok(fieldSet.has(col), `${report.id} unknown field: ${col}`);
    }

    const cat = EOD_LEGACY_CATEGORIES.find((c) => c.id === report.categoryId);
    assert.ok(cat, `${report.id} unknown category: ${report.categoryId}`);
    assert.equal(byRpr!.starter.group, cat!.label);

    assert.equal(eodWizardDesignUrl(report.id), `/reports?tab=design&rpr=${encodeURIComponent(report.id)}`);
  }
});

test('eod wizard design URL', () => {
  assert.equal(eodWizardDesignUrl('GR101'), '/reports?tab=design&rpr=GR101');
  assert.equal(eodWizardDesignUrl('GR401N'), '/reports?tab=design&rpr=GR401N');
});

test('field catalog — gün sonu modülünde GR starterları', () => {
  const eod = moduleById('eod');
  assert.ok(eod);
  assert.equal(eod!.starters.length, EOD_LEGACY_REPORTS.length + 2);
  assert.ok(eod!.starters.some((s) => s.id === 'eod-gr101'));
  assert.ok(eod!.starters.some((s) => s.id === 'eod-gr401n'));
  assert.ok(eod!.starters.some((s) => s.id === 'eod-grkasaislem'));
});
