import assert from 'node:assert/strict';
import test from 'node:test';
import {
  AYARLAR_MODULE_MENU,
  isAyarlarMenuContext,
  moduleMenuForPath,
} from './module-menus';

test('isAyarlarMenuContext — ayarlar rotaları', () => {
  assert.equal(isAyarlarMenuContext('/settings', 'hub=ayarlar'), true);
  assert.equal(isAyarlarMenuContext('/settings', 'tab=password'), true);
  assert.equal(isAyarlarMenuContext('/settings', 'tab=theme'), true);
  assert.equal(isAyarlarMenuContext('/settings', 'tool=calculator'), true);
  assert.equal(isAyarlarMenuContext('/settings/privacy', ''), true);
  assert.equal(isAyarlarMenuContext('/settings/privacy', 'tab=sql'), true);
  assert.equal(isAyarlarMenuContext('/settings/licensing', ''), true);
  assert.equal(isAyarlarMenuContext('/settings', 'section=users'), false);
  assert.equal(isAyarlarMenuContext('/settings/integrations', ''), false);
});

test('moduleMenuForPath — ayarlar yan menüsü', () => {
  assert.equal(moduleMenuForPath('/settings', 'hub=ayarlar'), AYARLAR_MODULE_MENU);
  assert.equal(moduleMenuForPath('/settings', 'tab=theme'), AYARLAR_MODULE_MENU);
  assert.equal(moduleMenuForPath('/settings/privacy', 'tab=sql'), AYARLAR_MODULE_MENU);
  assert.equal(moduleMenuForPath('/settings', 'section=users') !== AYARLAR_MODULE_MENU, true);
});

test('AYARLAR_MODULE_MENU — kısayol ve güvenlik', () => {
  assert.ok(AYARLAR_MODULE_MENU.some((item) => item.label === 'Sisteme Giriş'));
  assert.ok(AYARLAR_MODULE_MENU.some((item) => item.label === 'Şifre Değiştir'));
  assert.ok(AYARLAR_MODULE_MENU.some((item) => item.label === 'KVKK & Gizlilik'));
  assert.ok(AYARLAR_MODULE_MENU.some((item) => item.label === 'Lisanslama'));
});
