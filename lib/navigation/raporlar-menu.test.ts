import assert from 'node:assert/strict';
import test from 'node:test';
import {
  ARKABURO_MODULE_MENU,
  GUNSONU_MODULE_MENU,
  isArkaburoMenuContext,
  isGunsonuMenuContext,
  isRaporlarMenuContext,
  moduleMenuForPath,
  RAPORLAR_MODULE_MENU,
} from './module-menus';

test('isRaporlarMenuContext — raporlar rotaları', () => {
  assert.equal(isRaporlarMenuContext('/reports', ''), true);
  assert.equal(isRaporlarMenuContext('/reports', 'hub=raporlar'), true);
  assert.equal(isRaporlarMenuContext('/reports', 'category=rezervasyon'), true);
  assert.equal(isRaporlarMenuContext('/reports', 'tab=special'), true);
  assert.equal(isRaporlarMenuContext('/reports', 'tab=design'), false);
  assert.equal(isRaporlarMenuContext('/reports', 'tab=eod'), false);
  assert.equal(isRaporlarMenuContext('/reports', 'report=dept-revenue-old'), false);
});

test('isArkaburoMenuContext — arka büro rotaları', () => {
  assert.equal(isArkaburoMenuContext('/accounting', ''), true);
  assert.equal(isArkaburoMenuContext('/accounting', 'tab=invoices'), true);
  assert.equal(isArkaburoMenuContext('/accounting', 'hub=arkaburo'), true);
  assert.equal(isArkaburoMenuContext('/reports', 'tab=prepare'), true);
  assert.equal(isArkaburoMenuContext('/reports', 'report=gunluk-balans'), true);
  assert.equal(isArkaburoMenuContext('/reports', 'category=rezervasyon'), false);
});

test('isGunsonuMenuContext — gün sonu rotaları', () => {
  assert.equal(isGunsonuMenuContext('/reports', 'hub=gunsonu'), true);
  assert.equal(isGunsonuMenuContext('/reports', 'tab=eod&action=fetch'), true);
  assert.equal(isGunsonuMenuContext('/reports', 'tab=eod&action=archive'), true);
  assert.equal(isGunsonuMenuContext('/reports', ''), false);
});

test('moduleMenuForPath — raporlar, arka büro ve gün sonu yan menüleri', () => {
  assert.equal(moduleMenuForPath('/reports', ''), RAPORLAR_MODULE_MENU);
  assert.equal(moduleMenuForPath('/reports', 'category=forecast'), RAPORLAR_MODULE_MENU);
  assert.equal(moduleMenuForPath('/accounting', 'tab=cari'), ARKABURO_MODULE_MENU);
  assert.equal(moduleMenuForPath('/reports', 'tab=eod&action=close'), GUNSONU_MODULE_MENU);
  assert.equal(moduleMenuForPath('/reports', 'report=kredi-kontrol'), ARKABURO_MODULE_MENU);
});

test('RAPORLAR_MODULE_MENU — raporlama programı ve kategoriler', () => {
  assert.ok(RAPORLAR_MODULE_MENU.some((item) => item.label === 'Raporlar Merkezi'));
  assert.ok(RAPORLAR_MODULE_MENU.some((item) => item.label === 'Raporlama Programı'));
  assert.ok(RAPORLAR_MODULE_MENU.some((item) => item.label === 'FO-Önbüro Raporları'));
});

test('ARKABURO_MODULE_MENU — fatura ve cari işlemleri', () => {
  assert.ok(ARKABURO_MODULE_MENU.some((item) => item.label === 'Arka Büro Merkezi'));
  assert.ok(ARKABURO_MODULE_MENU.some((item) => item.label === 'Fatura Listesi'));
  assert.ok(ARKABURO_MODULE_MENU.some((item) => item.label === 'Cari Kartlar'));
});

test('GUNSONU_MODULE_MENU — night audit adımları', () => {
  assert.ok(GUNSONU_MODULE_MENU.some((item) => item.label === 'Gün Sonu Merkezi'));
  assert.ok(GUNSONU_MODULE_MENU.some((item) => item.label === 'Gün Sonu Raporlarını Al'));
  assert.ok(GUNSONU_MODULE_MENU.some((item) => item.label === 'Eski Gün Sonu Raporları'));
});
