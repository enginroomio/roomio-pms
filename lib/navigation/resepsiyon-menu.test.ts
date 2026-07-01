import assert from 'node:assert/strict';
import test from 'node:test';
import {
  isOnkasaMenuContext,
  isResepsiyonMenuContext,
  moduleMenuForPath,
  ONKASA_MODULE_MENU,
  RESEPSIYON_MODULE_MENU,
} from './module-menus';

test('isResepsiyonMenuContext — resepsiyon rotaları', () => {
  assert.equal(isResepsiyonMenuContext('/reception'), true);
  assert.equal(isResepsiyonMenuContext('/reception/inhouse'), true);
  assert.equal(isResepsiyonMenuContext('/guest-relations/info-rack'), false);
  assert.equal(isResepsiyonMenuContext('/reception', 'tab=kasa'), false);
  assert.equal(isResepsiyonMenuContext('/reception', 'hub=onkasa'), false);
});

test('isOnkasaMenuContext — ön kasa sekmeleri', () => {
  assert.equal(isOnkasaMenuContext('/reception', 'tab=kasa'), true);
  assert.equal(isOnkasaMenuContext('/reception', 'hub=onkasa'), true);
  assert.equal(isOnkasaMenuContext('/reception/departures', 'tab=fx'), true);
  assert.equal(isOnkasaMenuContext('/reception/inhouse', 'tab=bulk'), true);
  assert.equal(isOnkasaMenuContext('/reception/inhouse', 'tab=room-changes'), false);
});

test('moduleMenuForPath — resepsiyon ve ön kasa yan menüleri', () => {
  assert.equal(moduleMenuForPath('/reception', ''), RESEPSIYON_MODULE_MENU);
  assert.equal(moduleMenuForPath('/reception', 'tab=kasa'), ONKASA_MODULE_MENU);
  assert.equal(moduleMenuForPath('/reception/inhouse', ''), RESEPSIYON_MODULE_MENU);
  assert.equal(moduleMenuForPath('/guest-relations/info-rack', '') !== RESEPSIYON_MODULE_MENU, true);
  assert.equal(moduleMenuForPath('/guest-relations/traces', '') !== RESEPSIYON_MODULE_MENU, true);
});

test('RESEPSIYON_MODULE_MENU — tam üst menü ağacı', () => {
  assert.ok(RESEPSIYON_MODULE_MENU.length > 12);
  assert.ok(RESEPSIYON_MODULE_MENU.some((item) => item.label === 'Özet'));
  assert.ok(RESEPSIYON_MODULE_MENU.some((item) => item.label === 'Konaklayanlar Listesi'));
  assert.ok(RESEPSIYON_MODULE_MENU.some((item) => item.label === 'Info Rack (İsim Listesi)'));
});

test('ONKASA_MODULE_MENU — kasa işlemleri', () => {
  assert.ok(ONKASA_MODULE_MENU.some((item) => item.label === 'Kasa Defterleri'));
  assert.ok(ONKASA_MODULE_MENU.some((item) => item.label === 'Ön Kasa Merkezi'));
});
