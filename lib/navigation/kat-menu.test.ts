import assert from 'node:assert/strict';
import test from 'node:test';
import {
  isKatMenuContext,
  KAT_MODULE_MENU,
  moduleMenuForPath,
} from './module-menus';

test('isKatMenuContext — kat rotaları', () => {
  assert.equal(isKatMenuContext('/housekeeping'), true);
  assert.equal(isKatMenuContext('/housekeeping/rooms'), true);
  assert.equal(isKatMenuContext('/housekeeping/tasks'), true);
  assert.equal(isKatMenuContext('/reception/inhouse'), false);
});

test('moduleMenuForPath — kat yan menüsü', () => {
  assert.equal(moduleMenuForPath('/housekeeping', ''), KAT_MODULE_MENU);
  assert.equal(moduleMenuForPath('/housekeeping', 'hub=kat'), KAT_MODULE_MENU);
  assert.equal(moduleMenuForPath('/housekeeping/rooms', 'tab=control'), KAT_MODULE_MENU);
  assert.equal(moduleMenuForPath('/reservations', '') !== KAT_MODULE_MENU, true);
});

test('KAT_MODULE_MENU — tam üst menü ağacı', () => {
  assert.ok(KAT_MODULE_MENU.length > 12);
  assert.ok(KAT_MODULE_MENU.some((item) => item.label === 'Housekeeping Pano'));
  assert.ok(KAT_MODULE_MENU.some((item) => item.label === 'Oda Listesi'));
  assert.ok(KAT_MODULE_MENU.some((item) => item.label === 'House Keeping Oda İşlemleri'));
});
