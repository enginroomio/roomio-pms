import assert from 'node:assert/strict';
import test from 'node:test';
import { DIL_TANIMLARI_TABS, isDilTanimlariSection } from './dil-tanimlari';

test('isDilTanimlariSection — tüm dil alt ekranları', () => {
  for (const tab of DIL_TANIMLARI_TABS) {
    assert.equal(isDilTanimlariSection(tab.id), true);
  }
  assert.equal(isDilTanimlariSection('users'), false);
  assert.equal(isDilTanimlariSection(null), false);
});

test('DIL_TANIMLARI_TABS — benzersiz href', () => {
  const hrefs = DIL_TANIMLARI_TABS.map((t) => t.href);
  assert.equal(new Set(hrefs).size, hrefs.length);
});
