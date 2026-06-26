import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { passwordsMatch, validatePassword } from './password';

describe('validatePassword', () => {
  it('rejects short passwords', () => {
    assert.equal(validatePassword('abc1'), 'Şifre en az 8 karakter olmalıdır');
  });

  it('requires a letter', () => {
    assert.equal(validatePassword('12345678'), 'Şifre en az bir harf içermelidir');
  });

  it('requires a digit', () => {
    assert.equal(validatePassword('abcdefgh'), 'Şifre en az bir rakam içermelidir');
  });

  it('accepts valid passwords', () => {
    assert.equal(validatePassword('roomio123'), null);
  });
});

describe('passwordsMatch', () => {
  it('compares exactly', () => {
    assert.equal(passwordsMatch('a', 'a'), true);
    assert.equal(passwordsMatch('a', 'b'), false);
  });
});
