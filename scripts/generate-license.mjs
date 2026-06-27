#!/usr/bin/env node
/** Roomio — müşteri lisans anahtarı üret (CLI) */
import { createSign, randomUUID } from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';

const args = Object.fromEntries(
  process.argv.slice(2).reduce((acc, cur, i, arr) => {
    if (cur.startsWith('--')) acc.push([cur.slice(2), arr[i + 1]]);
    return acc;
  }, []),
);

const company = args.company ?? 'Demo Otel A.Ş.';
const property = args.property ?? 'Demo Hotel';
const code = args.code ?? 'DEMO01';
const rooms = Number(args.rooms ?? 77);
const users = Number(args.users ?? 50);
const email = args.email ?? 'license@example.com';
const edition = args.edition ?? 'professional';
const months = Number(args.months ?? 12);

const privPath = path.join(process.cwd(), 'keys', 'license-private.pem');
if (!fs.existsSync(privPath)) {
  console.error('Önce: npm run license:keys');
  process.exit(1);
}
const privateKey = fs.readFileSync(privPath, 'utf8');

const issued = new Date();
const expires = new Date(issued);
expires.setMonth(expires.getMonth() + months);

const modules =
  edition === 'enterprise'
    ? ['reservations', 'reception', 'housekeeping', 'guest-relations', 'fnb', 'accounting', 'reports', 'integrations']
    : edition === 'starter'
      ? ['reservations', 'reception', 'housekeeping']
      : ['reservations', 'reception', 'housekeeping', 'guest-relations', 'reports', 'integrations'];

const payload = {
  v: 1,
  licenseId: randomUUID(),
  companyName: company,
  taxNumber: args.tax ?? undefined,
  propertyName: property,
  propertyCode: code,
  contactEmail: email,
  maxRooms: rooms,
  maxUsers: users,
  edition,
  modules,
  issuedAt: issued.toISOString().slice(0, 10),
  expiresAt: expires.toISOString().slice(0, 10),
  notes: args.notes,
};

const body = Buffer.from(JSON.stringify(payload)).toString('base64url');
const sign = createSign('RSA-SHA256');
sign.update(body);
sign.end();
const signature = sign.sign(privateKey).toString('base64url');
const token = `ROOMIO-LIC-v1.${body}.${signature}`;

console.log('\n--- Roomio Lisans Anahtarı ---');
console.log(token);
console.log('\n--- Özet ---');
console.log(JSON.stringify(payload, null, 2));
