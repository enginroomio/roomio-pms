import assert from 'node:assert/strict';
import test from 'node:test';
import { isSistemMenuContext, moduleMenuForPath, SISTEM_MODULE_MENU } from './module-menus';

test('isSistemMenuContext — raporlar modülü', () => {
  assert.equal(isSistemMenuContext('/reports', ''), false);
  assert.equal(isSistemMenuContext('/reports', 'tab=design'), true);
  assert.equal(isSistemMenuContext('/reports', 'tab=user'), true);
  assert.equal(isSistemMenuContext('/reports', 'tab=management'), false);
  assert.equal(isSistemMenuContext('/reports', 'tab=special'), false);
  assert.equal(isSistemMenuContext('/reports', 'hub=raporlar'), false);
  assert.equal(isSistemMenuContext('/reports', 'category=rezervasyon'), false);
  assert.equal(isSistemMenuContext('/reports', 'tab=eod'), false);
});

test('isSistemMenuContext — entegrasyonlar', () => {
  assert.equal(isSistemMenuContext('/settings/integrations', ''), true);
  assert.equal(isSistemMenuContext('/settings/integrations/tesa', ''), true);
  assert.equal(isSistemMenuContext('/settings/compliance/5651', 'tab=devices'), true);
});

test('isSistemMenuContext — kuruluş dil bölümleri', () => {
  assert.equal(isSistemMenuContext('/settings', 'section=language'), true);
  assert.equal(isSistemMenuContext('/settings', 'section=users'), false);
});

test('moduleMenuForPath — sistem sayfalarında SISTEM_MODULE_MENU', () => {
  assert.equal(moduleMenuForPath('/reports', 'tab=design'), SISTEM_MODULE_MENU);
  assert.equal(moduleMenuForPath('/settings/integrations/tesa', ''), SISTEM_MODULE_MENU);
  assert.equal(moduleMenuForPath('/settings', 'section=users') !== SISTEM_MODULE_MENU, true);
});
