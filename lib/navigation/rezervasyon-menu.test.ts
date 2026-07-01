import assert from 'node:assert/strict';
import test from 'node:test';
import {
  isRezervasyonMenuContext,
  moduleMenuForPath,
  REZERVASYON_MODULE_MENU,
} from './module-menus';

test('isRezervasyonMenuContext — rezervasyon rotaları', () => {
  assert.equal(isRezervasyonMenuContext('/reservations'), true);
  assert.equal(isRezervasyonMenuContext('/reservations/calendar'), true);
  assert.equal(isRezervasyonMenuContext('/reservations/new'), true);
  assert.equal(isRezervasyonMenuContext('/groups'), true);
  assert.equal(isRezervasyonMenuContext('/rooms'), true);
  assert.equal(isRezervasyonMenuContext('/reception/inhouse'), false);
});

test('moduleMenuForPath — rezervasyon yan menüsü', () => {
  assert.equal(moduleMenuForPath('/reservations', ''), REZERVASYON_MODULE_MENU);
  assert.equal(moduleMenuForPath('/reservations', 'tab=import'), REZERVASYON_MODULE_MENU);
  assert.equal(moduleMenuForPath('/groups', ''), REZERVASYON_MODULE_MENU);
  assert.equal(moduleMenuForPath('/reception/inhouse', '') !== REZERVASYON_MODULE_MENU, true);
});

test('REZERVASYON_MODULE_MENU — tam üst menü ağacı', () => {
  assert.ok(REZERVASYON_MODULE_MENU.length > 12);
  assert.ok(REZERVASYON_MODULE_MENU.some((item) => item.label === 'Rezervasyon Listesi'));
  assert.ok(REZERVASYON_MODULE_MENU.some((item) => item.label === 'Grafikler (F1)'));
});
