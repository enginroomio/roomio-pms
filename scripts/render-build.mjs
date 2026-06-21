#!/usr/bin/env node
/** Render.com build script — postinstall güvenli. */
import { spawnSync } from 'node:child_process';

function run(cmd, args) {
  console.log(`\n→ ${cmd} ${args.join(' ')}`);
  const r = spawnSync(cmd, args, { stdio: 'inherit', shell: false, env: process.env });
  if (r.status !== 0) process.exit(r.status ?? 1);
}

run('npm', ['ci', '--ignore-scripts']);
run('npm', ['run', 'db:generate']);
run('npm', ['run', 'build']);
