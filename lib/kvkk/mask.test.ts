import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { maskBirthDate, maskEmail, maskGuestName, maskIdNo, maskPhone } from './mask';

describe('maskEmail', () => {
  it('masks local part', () => {
    assert.equal(maskEmail('guest@hotel.com'), 'gu***@hotel.com');
  });
});

describe('maskPhone', () => {
  it('shows last four digits', () => {
    assert.equal(maskPhone('+90 532 123 4567'), '*** *** 4567');
  });
});

describe('maskIdNo', () => {
  it('masks long id numbers', () => {
    assert.equal(maskIdNo('12345678901'), '123****01');
  });
});

describe('maskGuestName', () => {
  it('masks each name part', () => {
    assert.match(maskGuestName('Ayşe Yılmaz'), /Ay\*+/);
  });
});

describe('maskBirthDate', () => {
  it('keeps year only', () => {
    assert.equal(maskBirthDate('1990-05-12'), '1990-**-**');
  });
});
