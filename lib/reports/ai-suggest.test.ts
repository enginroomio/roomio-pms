import assert from 'node:assert/strict';
import test from 'node:test';
import { suggestReportFromPrompt } from './ai-suggest';

test('ai suggest — GR310 departman', () => {
  const s = suggestReportFromPrompt('GR310 departman işlem listesi');
  assert.equal(s.module, 'Gün Sonu');
  assert.equal(s.name, 'Günlük Departman İşlem Listesi');
  assert.ok(s.columns.includes('deptNo'));
});

test('ai suggest — polis listesi', () => {
  const s = suggestReportFromPrompt('günlük polis listesi');
  assert.equal(s.module, 'Gün Sonu');
  assert.match(s.explanation, /GR222|Elektra|Polis/i);
});

test('ai suggest — GR502 kodu', () => {
  const s = suggestReportFromPrompt('GR502 fatura');
  assert.equal(s.module, 'Gün Sonu');
  assert.equal(s.name, 'FATURA KONTROL LİSTESİ');
});
