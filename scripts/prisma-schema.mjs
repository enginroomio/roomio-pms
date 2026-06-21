#!/usr/bin/env node
/** Prisma şema seçimi — SQLite vs PostgreSQL. */
import { existsSync } from 'node:fs';

export function isPostgresUrl(url = process.env.DATABASE_URL ?? '') {
  return url.startsWith('postgresql://') || url.startsWith('postgres://');
}

export function prismaSchemaPath(url = process.env.DATABASE_URL ?? '') {
  if (process.env.PRISMA_SCHEMA === 'postgresql') return 'prisma/schema.postgresql.prisma';
  if (process.env.PRISMA_SCHEMA === 'sqlite') return 'prisma/schema.prisma';
  return isPostgresUrl(url) ? 'prisma/schema.postgresql.prisma' : 'prisma/schema.prisma';
}

export function assertSchemaFiles() {
  const sqlite = 'prisma/schema.prisma';
  const pg = 'prisma/schema.postgresql.prisma';
  return existsSync(sqlite) && existsSync(pg);
}
