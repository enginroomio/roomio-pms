#!/usr/bin/env node
/** Roomio — RSA-4096 lisans anahtar çifti üret (satıcı makinesinde bir kez) */
import { generateKeyPairSync } from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';

const dir = path.join(process.cwd(), 'keys');
const pub = path.join(dir, 'license-public.pem');
const priv = path.join(dir, 'license-private.pem');

if (fs.existsSync(priv)) {
  console.log('Anahtarlar zaten var:', dir);
  process.exit(0);
}

fs.mkdirSync(dir, { recursive: true });
const { publicKey, privateKey } = generateKeyPairSync('rsa', {
  modulusLength: 4096,
  publicKeyEncoding: { type: 'spki', format: 'pem' },
  privateKeyEncoding: { type: 'pkcs8', format: 'pem' },
});

fs.writeFileSync(pub, publicKey);
fs.writeFileSync(priv, privateKey, { mode: 0o600 });

const gitignore = path.join(process.cwd(), '.gitignore');
if (fs.existsSync(gitignore)) {
  const g = fs.readFileSync(gitignore, 'utf8');
  if (!g.includes('license-private.pem')) {
    fs.appendFileSync(gitignore, '\nkeys/license-private.pem\n');
  }
}

console.log('✓ RSA-4096 anahtar çifti oluşturuldu');
console.log('  Public :', pub);
console.log('  Private:', priv, '(GİT\'E EKLEMEYİN — sadece satıcı)');
