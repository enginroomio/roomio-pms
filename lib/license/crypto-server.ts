import { createSign, createVerify } from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import type { LicensePayload, LicenseValidation } from '@/lib/license/types';
import { LICENSE_PREFIX } from '@/lib/license/types';

const PUBLIC_KEY_PATH = path.join(process.cwd(), 'keys', 'license-public.pem');

function loadPublicKey(): string {
  const env = process.env.ROOMIO_LICENSE_PUBLIC_KEY;
  if (env) return env.replace(/\\n/g, '\n');
  if (fs.existsSync(PUBLIC_KEY_PATH)) return fs.readFileSync(PUBLIC_KEY_PATH, 'utf8');
  throw new Error('Lisans public key bulunamadı. npm run license:keys çalıştırın.');
}

function loadPrivateKey(): string {
  const env = process.env.ROOMIO_LICENSE_PRIVATE_KEY;
  if (env) return env.replace(/\\n/g, '\n');
  const privPath = path.join(process.cwd(), 'keys', 'license-private.pem');
  if (fs.existsSync(privPath)) return fs.readFileSync(privPath, 'utf8');
  throw new Error('Lisans private key bulunamadı (sadece satıcı makinesinde).');
}

function b64url(input: Buffer | string): string {
  const buf = typeof input === 'string' ? Buffer.from(input, 'utf8') : input;
  return buf.toString('base64url');
}

function fromB64url(input: string): string {
  return Buffer.from(input, 'base64url').toString('utf8');
}

export function signLicense(payload: LicensePayload, privateKeyPem?: string): string {
  const body = b64url(JSON.stringify(payload));
  const sign = createSign('RSA-SHA256');
  sign.update(body);
  sign.end();
  const key = privateKeyPem ?? loadPrivateKey();
  const signature = sign.sign(key);
  return `${LICENSE_PREFIX}.${body}.${b64url(signature)}`;
}

export function verifyLicense(token: string): LicenseValidation {
  try {
    const parts = token.trim().split('.');
    if (parts.length !== 4 || parts[0] !== 'ROOMIO-LIC' || parts[1] !== 'v1') {
      return { valid: false, error: 'Geçersiz lisans formatı' };
    }
    const body = parts[2];
    const sig = parts[3];
    const verify = createVerify('RSA-SHA256');
    verify.update(body);
    verify.end();
    const ok = verify.verify(loadPublicKey(), Buffer.from(sig, 'base64url'));
    if (!ok) return { valid: false, error: 'Lisans imzası geçersiz' };

    const payload = JSON.parse(fromB64url(body)) as LicensePayload;
    if (payload.v !== 1) return { valid: false, error: 'Desteklenmeyen lisans sürümü' };

    const expires = new Date(payload.expiresAt);
    const now = new Date();
    if (Number.isNaN(expires.getTime())) return { valid: false, error: 'Geçersiz bitiş tarihi' };
    if (expires < now) return { valid: false, error: 'Lisans süresi dolmuş', payload };

    const daysRemaining = Math.ceil((expires.getTime() - now.getTime()) / 86400000);
    return { valid: true, payload, daysRemaining };
  } catch (e) {
    return { valid: false, error: e instanceof Error ? e.message : 'Doğrulama hatası' };
  }
}

export function getPublicKeyForDisplay(): string {
  return loadPublicKey();
}
