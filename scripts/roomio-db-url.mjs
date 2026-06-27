#!/usr/bin/env node
/** Yerel SQLite veritabanı için mutlak DATABASE_URL (cwd bağımsız). */
import { existsSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');

export function roomioDbPath() {
  return join(ROOT, '.roomio-data', 'roomio.db');
}

export function roomioDatabaseUrl() {
  const fromEnv = process.env.DATABASE_URL?.trim();
  if (fromEnv?.startsWith('file:')) {
    const pathPart = fromEnv.slice(5);
    if (pathPart.startsWith('/')) return fromEnv;
    return `file:${join(ROOT, pathPart)}`;
  }
  return `file:${roomioDbPath()}`;
}

export function assertRoomioDb() {
  const path = roomioDbPath();
  if (!existsSync(path)) {
    throw new Error(`Veritabanı bulunamadı: ${path} — önce npm run db:push çalıştırın`);
  }
  return path;
}
