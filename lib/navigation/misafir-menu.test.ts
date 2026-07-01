import assert from 'node:assert/strict';
import test from 'node:test';
import {
  BANKET_MODULE_MENU,
  isBanketMenuContext,
  isMisafirMenuContext,
  MISAFIR_MODULE_MENU,
  moduleMenuForPath,
} from './module-menus';

test('isMisafirMenuContext — misafir rotaları', () => {
  assert.equal(isMisafirMenuContext('/guest-relations'), true);
  assert.equal(isMisafirMenuContext('/guest-relations/traces'), true);
  assert.equal(isMisafirMenuContext('/guest-relations/info-rack'), true);
  assert.equal(isMisafirMenuContext('/reception/inhouse'), false);
});

test('isBanketMenuContext — banket rotaları', () => {
  assert.equal(isBanketMenuContext('/fnb'), true);
  assert.equal(isBanketMenuContext('/fnb?tab=calendar'), true);
  assert.equal(isBanketMenuContext('/guest-relations'), false);
});

test('moduleMenuForPath — misafir ve banket yan menüleri', () => {
  assert.equal(moduleMenuForPath('/guest-relations', ''), MISAFIR_MODULE_MENU);
  assert.equal(moduleMenuForPath('/guest-relations/traces', 'tab=agenda'), MISAFIR_MODULE_MENU);
  assert.equal(moduleMenuForPath('/fnb', ''), BANKET_MODULE_MENU);
  assert.equal(moduleMenuForPath('/fnb', 'hub=banket'), BANKET_MODULE_MENU);
});

test('MISAFIR_MODULE_MENU — tam üst menü ağacı', () => {
  assert.ok(MISAFIR_MODULE_MENU.length > 12);
  assert.ok(MISAFIR_MODULE_MENU.some((item) => item.label === 'Misafir İlişkileri Özeti'));
  assert.ok(MISAFIR_MODULE_MENU.some((item) => item.label === 'Takip Listesi (Traces)'));
  assert.ok(MISAFIR_MODULE_MENU.some((item) => item.label === 'VIP Misafir Listesi'));
});

test('BANKET_MODULE_MENU — banket işlemleri', () => {
  assert.ok(BANKET_MODULE_MENU.some((item) => item.label === 'Banket Merkezi'));
  assert.ok(BANKET_MODULE_MENU.some((item) => item.label === 'Banket Rezervasyon'));
  assert.ok(BANKET_MODULE_MENU.some((item) => item.label === 'Banket Ajanda'));
});
