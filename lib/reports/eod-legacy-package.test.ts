import assert from 'node:assert/strict';
import test from 'node:test';
import { DEMO_RESERVATIONS } from '@/lib/data/reservations';
import { EOD_LEGACY_REPORTS } from './eod-legacy-catalog';
import {
  buildLiveFolioAuditRows,
  buildLiveEmailGuestRows,
} from './eod-legacy-live';
import { buildEodLegacyPackage } from './eod-legacy-package';

const ctx = {
  hotelName: 'HOTELSAPPHIRE',
  businessDate: '2026-06-27',
  userName: 'OGUZHAN',
  generatedAt: new Date('2026-06-28T03:52:58'),
  reservations: DEMO_RESERVATIONS,
  folioBalances: { 'rez-13': 4200 },
};

test('package — 49 GR raporu üretir', () => {
  const pkg = buildEodLegacyPackage(ctx);
  assert.equal(pkg.reportCount, EOD_LEGACY_REPORTS.length);
  assert.equal(pkg.reports.length, 49);
  assert.ok(pkg.texts.GR400?.includes('Günlük Yönetim') || pkg.texts.GR400?.includes('Yönetim'));
  assert.ok(pkg.texts.GR222?.includes('Polis') || pkg.texts.GR222?.includes('FATMA'));
});

test('live — folyo audit charge satırları', () => {
  const auditCtx = {
    ...ctx,
    auditLogs: [
      {
        id: 'aud-1',
        businessDate: '2026-06-27',
        createdAt: '2026-06-27 10:00:00',
        module: 'folio' as const,
        action: 'charge',
        entityType: 'Reservation',
        entityId: 'rez-13',
        user: 'Arda Y.',
        detail: 'Konaklama DBL · 5200',
      },
    ],
  };
  const rows = buildLiveFolioAuditRows(auditCtx, 'correction');
  assert.equal(rows.length, 0);
  const charges = buildLiveFolioAuditRows(auditCtx, 'cancelled');
  assert.equal(charges.length, 0);
});

test('live — GRMAIL e-postalı misafir', () => {
  const emailCtx = {
    ...ctx,
    reservations: ctx.reservations.map((r) =>
      r.id === 'rez-15' ? { ...r, email: 'sarah@example.com' } : r,
    ),
  };
  const rows = buildLiveEmailGuestRows(emailCtx);
  assert.equal(rows.length, 1);
  assert.match(rows[0]!.guest, /SARAH/);
});
