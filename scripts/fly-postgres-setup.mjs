#!/usr/bin/env node
/**
 * Fly Postgres kurulum rehberi + dry-run.
 * Kullanım: npm run fly:postgres:setup
 */
import { existsSync } from 'node:fs';
import { flyAppName, hasFlyCli, runFly } from './fly-production.mjs';

const app = flyAppName();
const cluster = process.env.FLY_POSTGRES_APP ?? `${app}-db`;

console.log('\n── Fly Postgres kurulum ──\n');
console.log(`App:     ${app}`);
console.log(`Cluster: ${cluster}\n`);

let ok = true;
for (const f of ['fly.toml', 'prisma/schema.postgresql.prisma', 'scripts/docker-entrypoint.mjs']) {
  const hit = existsSync(f);
  console.log(`${hit ? '✓' : '✗'} ${f}`);
  if (!hit) ok = false;
}

if (!hasFlyCli()) {
  console.log('\nℹ fly CLI yok — komutlar (Terminal.app):');
  console.log(`  fly postgres create --name ${cluster} --region fra --initial-cluster-size 1`);
  console.log(`  fly postgres attach ${cluster} -a ${app}`);
  console.log(`  fly secrets set PRISMA_SCHEMA=postgresql -a ${app}`);
  console.log('  npm run deploy:fly:live');
  process.exit(ok ? 0 : 1);
}

const whoami = runFly(['auth', 'whoami']);
if (whoami.status !== 0) {
  console.log('✗ fly auth login gerekli');
  process.exit(1);
}
console.log(`✓ fly auth — ${whoami.stdout.trim()}`);

const pgList = runFly(['postgres', 'list']);
if (pgList.status === 0) {
  const attached = pgList.stdout.includes(cluster) || pgList.stdout.includes(app);
  console.log(`${attached ? '✓' : 'ℹ'} Postgres cluster — ${attached ? 'mevcut' : 'henüz yok'}`);
}

console.log('\nCanlı kurulum:');
console.log(`  fly postgres create --name ${cluster} --region fra --initial-cluster-size 1`);
console.log(`  fly postgres attach ${cluster} -a ${app}`);
console.log(`  fly secrets set PRISMA_SCHEMA=postgresql -a ${app}`);
console.log('  npm run deploy:fly:live');
console.log('\nℹ Fly attach DATABASE_URL secret’i otomatik ayarlar.\n');
process.exit(ok ? 0 : 1);
