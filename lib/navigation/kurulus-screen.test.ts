import assert from 'node:assert/strict';
import test from 'node:test';
import { KONTRAT_NAV, KURULUS_NAV, type KurulusNavEntry } from './kurulus-nav';
import {
  isKurulusScreenImplemented,
  kurulusParamsFromHref,
  resolveKurulusScreenKey,
} from './kurulus-screen';

function walkEntries(entries: KurulusNavEntry[], fn: (entry: KurulusNavEntry) => void) {
  for (const entry of entries) {
    if (!entry.separator) fn(entry);
    for (const child of entry.children ?? []) {
      if (!child.separator) fn(child);
    }
  }
}

test('tüm kuruluş menü href\'leri uygulanmış ekrana gider', () => {
  const failures: string[] = [];
  walkEntries(KURULUS_NAV, (entry) => {
    if (!entry.href.startsWith('/settings')) return;
    const { section, tab } = kurulusParamsFromHref(entry.href);
    if (!isKurulusScreenImplemented(section, tab)) {
      failures.push(`${entry.label} → ${entry.href}`);
    }
  });
  for (const entry of KONTRAT_NAV) {
    const { section, tab } = kurulusParamsFromHref(entry.href);
    if (!isKurulusScreenImplemented(section, tab)) {
      failures.push(`${entry.label} → ${entry.href}`);
    }
  }
  assert.deepEqual(failures, []);
});

test('resolveKurulusScreenKey — section alias', () => {
  assert.equal(resolveKurulusScreenKey('source-codes', null), 'sources');
  assert.equal(resolveKurulusScreenKey(null, 'room-types'), 'room-types');
  assert.equal(resolveKurulusScreenKey(null, null), 'otel-bilgileri');
});
