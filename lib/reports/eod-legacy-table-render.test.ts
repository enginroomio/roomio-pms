import assert from 'node:assert/strict';
import test from 'node:test';
import { EOD_LEGACY_REPORTS } from './eod-legacy-catalog';
import { renderLegacyEodReport } from './eod-legacy-render';
import { EOD_BATCH_REPORT_IDS } from './eod-legacy-batch-render';
import { buildDemoRows, demoRowCount } from './eod-legacy-table-render';

const batchCtx = {
  hotelName: 'HOTELSAPPHIRE',
  businessDate: '2026-06-27',
  userName: 'OGUZHAN',
  generatedAt: new Date('2026-06-28T03:52:58'),
  reservations: [] as never[],
};

test('tablo render — demo satırlar üretir', () => {
  const rows = buildDemoRows(['roomNo', 'guestName', 'amount'], 'GR300');
  assert.equal(rows.length, 5);
  assert.equal(rows[0]!.roomNo, '208');
  assert.match(rows[0]!.guestName, /ABDULLA/);
});

test('tablo render — boş raporlar', () => {
  assert.equal(demoRowCount('GR301I'), 0);
  assert.equal(buildDemoRows(['folioNo'], 'GR301I').length, 0);
});

test('tüm GR raporları — placeholder metin yok', () => {
  const placeholder = /Bu rapor Elektra FastReport/;
  for (const report of EOD_LEGACY_REPORTS) {
    const text = renderLegacyEodReport(report, batchCtx);
    assert.ok(!placeholder.test(text), `${report.id} still uses placeholder`);
    assert.match(text, /Listelen(en|di) \d+/);
  }
});

test('sütun override — özel sütun düzeni', () => {
  const report = EOD_LEGACY_REPORTS.find((r) => r.id === 'GR101')!;
  const text = renderLegacyEodReport(report, batchCtx, {
    columnOverride: ['roomNo', 'guestName'],
  });
  assert.match(text, /Oda/);
  assert.match(text, /Misafir|1\.Misafir/);
  assert.doesNotMatch(text, /Bu rapor Elektra/);
});

test('GR300 — folyo extre zengin önizleme', () => {
  const report = EOD_LEGACY_REPORTS.find((r) => r.id === 'GR300')!;
  const text = renderLegacyEodReport(report, batchCtx);
  assert.match(text, /Folyo Extre Listesi/);
  assert.match(text, /F-20801/);
  assert.match(text, /ROOM CHARGE/);
  assert.match(text, /Listelenen 5/);
});

test('tüm GR raporları — batch veya switch render kapsamı', () => {
  const SWITCH_ONLY = new Set([
    'GR101', 'GR102', 'GR1021', 'GR103', 'GR104', 'GR105',
    'GR201', 'GR202', 'GR205', 'GR205G', 'GR206', 'GRODAFIYATKON',
  ]);
  const batchSet = new Set(EOD_BATCH_REPORT_IDS);

  for (const report of EOD_LEGACY_REPORTS) {
    assert.ok(
      SWITCH_ONLY.has(report.id) || batchSet.has(report.id),
      `${report.id} has no dedicated render`,
    );
    const text = renderLegacyEodReport(report, batchCtx);
    assert.ok(!/Bu rapor Elektra FastReport/.test(text), `${report.id} placeholder`);
    assert.match(text, /Listelen(en|di) \d+/);
  }

  assert.equal(SWITCH_ONLY.size + batchSet.size, EOD_LEGACY_REPORTS.length);
});
