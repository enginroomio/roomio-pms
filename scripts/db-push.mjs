#!/usr/bin/env node
/** Prisma şemasını sunucunun kullandığı SQLite dosyasına uygular (.roomio-data/roomio.db). */
import { spawnSync } from 'node:child_process';
import { roomioDatabaseUrl } from './roomio-db-url.mjs';

const dbUrl = roomioDatabaseUrl();
console.log(`[db:push] DATABASE_URL=${dbUrl}`);

const r = spawnSync('npx', ['prisma', 'db', 'push'], {
  stdio: 'inherit',
  env: { ...process.env, DATABASE_URL: dbUrl },
});

process.exit(r.status ?? 1);
