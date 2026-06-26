import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  normalizeAccountingTab,
  normalizeKurulusSection,
  reservationListTabFromParams,
} from './menu-route-params';

describe('normalizeKurulusSection', () => {
  it('maps menu aliases to panel keys', () => {
    assert.equal(normalizeKurulusSection('source-codes'), 'sources');
    assert.equal(normalizeKurulusSection('oda-tip'), 'room-types');
    assert.equal(normalizeKurulusSection('users'), 'users');
  });
});

describe('normalizeAccountingTab', () => {
  it('maps invoice aliases', () => {
    assert.equal(normalizeAccountingTab('proforma'), 'invoices');
    assert.equal(normalizeAccountingTab('cari'), 'ledger');
  });
});

describe('reservationListTabFromParams', () => {
  it('maps status to list tab', () => {
    assert.equal(reservationListTabFromParams('CHECKED_IN', null), 'inhouse');
    assert.equal(reservationListTabFromParams(null, '1'), 'all');
  });
});
