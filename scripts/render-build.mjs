#!/usr/bin/env node
/** Render.com build script — DB hazırlığı + Next build. */
import { spawnSync } from 'node:child_process';
import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname } from 'node:path';
import { prismaSchemaPath } from './prisma-schema.mjs';

const buildDb = process.env.DATABASE_URL ?? 'file:/tmp/roomio.db';
const schema = prismaSchemaPath(buildDb);

if (buildDb.startsWith('file:')) {
  mkdirSync(dirname(buildDb.replace(/^file:/, '')), { recursive: true });
}

writeFileSync('.env.production.local', `DATABASE_URL="${buildDb}"\n`, 'utf8');
console.log(`[render-build] node ${process.version}`);
console.log(`[render-build] DATABASE_URL=${buildDb}`);

function run(cmd, args, extraEnv = {}) {
  console.log(`\n→ ${cmd} ${args.join(' ')}`);
  const r = spawnSync(cmd, args, {
    stdio: 'inherit',
    shell: false,
    env: {
      ...process.env,
      DATABASE_URL: buildDb,
      NODE_OPTIONS: '--max-old-space-size=512',
      ...extraEnv,
    },
  });
  if (r.status !== 0) {
    console.error(`\n✗ failed: ${cmd} ${args.join(' ')}`);
    process.exit(r.status ?? 1);
  }
}

run('npm', ['ci', '--ignore-scripts', '--include=dev'], { NODE_ENV: 'development', npm_config_production: 'false' });
run('npx', ['prisma', 'generate', `--schema=${schema}`]);
run('npx', ['prisma', 'db', 'push', `--schema=${schema}`, '--skip-generate']);
const buildEnv = { NODE_ENV: 'production', NEXT_BUILD_WORKERS: '1' };
if (process.env.RENDER_GIT_COMMIT) buildEnv.GITHUB_SHA = process.env.RENDER_GIT_COMMIT;
run('npm', ['run', 'build'], buildEnv);
run('node', ['scripts/sync-standalone-assets.mjs']);
console.log('\n✅ render-build tamam');
