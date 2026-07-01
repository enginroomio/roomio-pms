import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { DEMO_FX_EXCHANGES } from '@/lib/data/cash';
import { seedFxExchangesIfEmpty, getFxExchangesServer } from '@/lib/server/fx-exchanges';
import { prisma } from '@/lib/server/prisma';

describe('DEMO_FX_EXCHANGES seed ids', () => {
  it('demo ids are unique within a property prefix scheme', () => {
    const propA = DEMO_FX_EXCHANGES.map((fx) => `prop-a-${fx.id}`);
    const propB = DEMO_FX_EXCHANGES.map((fx) => `prop-b-${fx.id}`);
    const all = [...propA, ...propB];
    assert.equal(all.length, new Set(all).size);
  });
});

describe('seedFxExchangesIfEmpty — çoklu şube', () => {
  it('her şube için ayrı kayıt oluşturur', async () => {
    const props = ['prop-sapphire-ist', 'prop-sapphire-ant'] as const;
    for (const prop of props) {
      await prisma.fxExchange.deleteMany({ where: { propertyId: prop } });
    }
    for (const prop of props) {
      await seedFxExchangesIfEmpty(prop);
    }
    for (const prop of props) {
      const rows = await getFxExchangesServer(prop);
      assert.equal(rows.length, DEMO_FX_EXCHANGES.length);
      assert.ok(rows.every((r) => r.id.startsWith(`${prop}-`)));
    }
  });
});
