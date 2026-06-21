#!/usr/bin/env node
/** Render.com build script — DB hazırlığı + Next build. */
import { spawnSync } from 'node:child_process';
import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname } from 'node:path';

const buildDb = process.env.DATABASE_URL ?? 'file:/tmp/roomio.db';

if (buildDb.startsWith('file:')) {
  mkdirSync(dirname(buildDb.replace(/^file:/, '')), { recursive: true });
}

writeFileSync('.env.production.local', `DATABASE_URL="${buildDb}"\n`, 'utf8');
console.log(`[render-build] DATABASE_URL=${buildDb}`);

function run(cmd, args, extraEnv = {}) {
  console.log(`\n→ ${cmd} ${args.join(' ')}`);
  const r = spawnSync(cmd, args, {
    stdio: 'inherit',
    shell: false,
    env: { ...process.env, DATABASE_URL: buildDb, ...extraEnv },
  });
  if (r.status !== 0) process.exit(r.status ?? 1);
}

// devDependencies (typescript, prisma CLI) build için gerekli — production NODE_ENV ile npm ci dev paketleri atlar
run('npm', ['ci', '--ignore-scripts'], { NODE_ENV: 'development' });
run('npm', ['run', 'db:generate']);
run('npx', ['prisma', 'db', 'push', '--schema=prisma/schema.prisma', '--skip-generate']);
run('npm', ['run', 'build'], { NODE_ENV: 'production' });
