#!/usr/bin/env node
/**
 * PostgreSQL şema ve Fly Postgres hazırlık testi.
 * Kullanım: npm run test:postgres
 */
import { existsSync, readFileSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import { assertSchemaFiles, isPostgresUrl, prismaSchemaPath } from './prisma-schema.mjs';

let ok = true;
console.log('PostgreSQL hazırlık testi\n');

ok = assertSchemaFiles() && ok;
console.log(`${assertSchemaFiles() ? '✓' : '✗'} schema.prisma + schema.postgresql.prisma`);

const sqlite = readFileSync('prisma/schema.prisma', 'utf8');
const pg = readFileSync('prisma/schema.postgresql.prisma', 'utf8');
const sqliteModels = [...sqlite.matchAll(/^model (\w+)/gm)].map((m) => m[1]).sort();
const pgModels = [...pg.matchAll(/^model (\w+)/gm)].map((m) => m[1]).sort();
const modelsMatch = JSON.stringify(sqliteModels) === JSON.stringify(pgModels);
console.log(`${modelsMatch ? '✓' : '✗'} Model parity (${sqliteModels.length} model)`);
if (!modelsMatch) {
  const missing = sqliteModels.filter((m) => !pgModels.includes(m));
  const extra = pgModels.filter((m) => !sqliteModels.includes(m));
  if (missing.length) console.log(`  eksik PG: ${missing.join(', ')}`);
  if (extra.length) console.log(`  fazla PG: ${extra.join(', ')}`);
  ok = false;
}

for (const f of ['docker-compose.prod.yml', '.env.production.example', 'scripts/docker-entrypoint.mjs']) {
  const hit = existsSync(f);
  console.log(`${hit ? '✓' : '✗'} ${f}`);
  if (!hit) ok = false;
}

const example = readFileSync('.env.production.example', 'utf8');
const pgDoc = example.includes('postgresql://');
console.log(`${pgDoc ? '✓' : '✗'} .env.production.example → postgresql URL`);
ok = pgDoc && ok;

const schemaPath = prismaSchemaPath('postgresql://roomio:roomio@localhost:5432/roomio');
console.log(`${schemaPath.includes('postgresql') ? '✓' : '✗'} prismaSchemaPath(postgres) → ${schemaPath}`);

const validate = spawnSync('npx', ['prisma', 'validate', '--schema=prisma/schema.postgresql.prisma'], {
  stdio: 'pipe',
  encoding: 'utf8',
  env: {
    ...process.env,
    DATABASE_URL: process.env.DATABASE_URL?.startsWith('postgres')
      ? process.env.DATABASE_URL
      : 'postgresql://roomio:roomio@127.0.0.1:5432/roomio?schema=public',
  },
});
const validateOk = validate.status === 0;
console.log(`${validateOk ? '✓' : '✗'} prisma validate (postgresql)`);
if (!validateOk) console.log(validate.stderr?.trim());
ok = validateOk && ok;

if (process.env.DATABASE_URL && isPostgresUrl(process.env.DATABASE_URL)) {
  const push = spawnSync('npm', ['run', 'db:push:pg'], { stdio: 'inherit', shell: true });
  console.log(`${push.status === 0 ? '✓' : '✗'} db:push:pg (canlı DATABASE_URL)`);
  ok = push.status === 0 && ok;
} else {
  console.log('ℹ DATABASE_URL postgres değil — db:push:pg atlandı');
  console.log('  Yerel PG: docker compose -f docker-compose.prod.yml up -d postgres');
  console.log('  Sonra: DATABASE_URL=postgresql://roomio:roomio@127.0.0.1:5432/roomio npm run db:push:pg');
}

console.log(ok ? '\n✓ PostgreSQL hazırlık geçti\n' : '\n✗ PostgreSQL hazırlık başarısız\n');
process.exit(ok ? 0 : 1);
