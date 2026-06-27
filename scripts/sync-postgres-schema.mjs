#!/usr/bin/env node
/**
 * prisma/schema.prisma (SQLite, geliştirme — kaynak) dosyasındaki tüm
 * modelleri prisma/schema.postgresql.prisma (production) dosyasına aktarır.
 *
 * Neden gerekli: Bu projede iki ayrı Prisma şeması var — geliştirmede
 * SQLite, production'da (DATABASE_URL=postgresql://...) PostgreSQL
 * kullanılıyor (bkz. scripts/prisma-schema.mjs, otomatik seçim yapar).
 * Modeller elle iki dosyada paralel tutulduğu için zamanla aradaki fark
 * büyüdü; bu script onları tek komutla yeniden senkronize eder.
 *
 * Model gövdeleri (alanlar, @relation, @@unique, @@index, yorumlar) SQLite
 * şemasından OLDUĞU GİBİ kopyalanır — iki dosyada da yalnızca taşınabilir
 * Prisma scalar tipleri (String/Int/Float/Boolean) ve `env("DATABASE_URL")`
 * kullanıldığından (DB'ye özgü `@db.X` belirteci YOK), model gövdesi
 * provider'dan bağımsızdır ve doğrudan kopyalanabilir.
 *
 * Korunan farklar (bilerek):
 *  - `datasource db { provider = "postgresql" }` (SQLite değil)
 *  - `generator client` bloğu — PostgreSQL deploy hedefleri (Render/Fly/Railway
 *    konteynerleri) için `binaryTargets` SQLite'dakiyle aynı tutulur, çünkü
 *    ikisi de aynı Docker image / Alpine Linux üzerinde çalışıyor.
 *
 * Kullanım: npm run db:sync-pg-schema
 *           npm run db:sync-pg-schema -- --check   (fark varsa exit 1, CI için)
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');
const SQLITE_SCHEMA_PATH = join(ROOT, 'prisma/schema.prisma');
const PG_SCHEMA_PATH = join(ROOT, 'prisma/schema.postgresql.prisma');

function extractModelBlocks(source) {
  // Bir "model bloğu" = (varsa) hemen üstündeki yorum satırları + `model X { ... }`.
  // Üst düzey `model ` ile başlayan satırları arar, eşleşen `}` parantezine
  // kadar her şeyi (iç içe `{}` desteğiyle) tek blok olarak alır.
  const lines = source.split('\n');
  const blocks = [];
  let i = 0;
  while (i < lines.length) {
    const line = lines[i];
    if (/^model\s+\w+\s*\{/.test(line)) {
      // Hemen üstündeki ardışık yorum satırlarını da bloğa dahil et.
      // İki yorum stilini destekler: `//` satır yorumu VE `/** ... */`
      // blok yorumu (içindeki ara satırlar `*` veya boşlukla başlar).
      let start = i;
      while (start > 0) {
        const prevTrimmed = lines[start - 1].trim();
        const isLineComment = /^\/\//.test(prevTrimmed);
        const isBlockCommentPart = /^\/?\*/.test(prevTrimmed); // `/**`, `*`, `*/`
        if (!isLineComment && !isBlockCommentPart) break;
        start -= 1;
      }
      // Eşleşen kapanış parantezini bul (model gövdesinde iç içe `{}` olmaz
      // ama yine de güvenli sayım yapıyoruz).
      let depth = 0;
      let end = i;
      for (; end < lines.length; end += 1) {
        for (const ch of lines[end]) {
          if (ch === '{') depth += 1;
          if (ch === '}') depth -= 1;
        }
        if (depth === 0 && end >= i) break;
      }
      const name = line.match(/^model\s+(\w+)\s*\{/)[1];
      blocks.push({ name, text: lines.slice(start, end + 1).join('\n') });
      i = end + 1;
    } else {
      i += 1;
    }
  }
  return blocks;
}

function buildPostgresSchema(sqliteSource, currentPgSource) {
  const generatorMatch = sqliteSource.match(/^generator client \{[\s\S]*?\n\}/m);
  if (!generatorMatch) throw new Error('SQLite şemasında generator bloğu bulunamadı');

  const header = [
    generatorMatch[0],
    '',
    'datasource db {',
    '  provider = "postgresql"',
    '  url      = env("DATABASE_URL")',
    '}',
  ].join('\n');

  const blocks = extractModelBlocks(sqliteSource);
  if (blocks.length === 0) throw new Error('SQLite şemasında hiç model bulunamadı — çıkarma mantığı bozuk olabilir');

  const body = blocks.map((b) => b.text).join('\n\n');
  return `${header}\n\n${body}\n`;
}

function main() {
  const checkOnly = process.argv.includes('--check');
  const sqliteSource = readFileSync(SQLITE_SCHEMA_PATH, 'utf8');
  const currentPgSource = readFileSync(PG_SCHEMA_PATH, 'utf8');

  const nextPgSource = buildPostgresSchema(sqliteSource, currentPgSource);

  if (checkOnly) {
    if (nextPgSource === currentPgSource) {
      console.log('✅ schema.postgresql.prisma güncel (schema.prisma ile senkron)');
      process.exit(0);
    }
    console.error('✗ schema.postgresql.prisma GÜNCEL DEĞİL — `npm run db:sync-pg-schema` çalıştırın');
    process.exit(1);
  }

  writeFileSync(PG_SCHEMA_PATH, nextPgSource, 'utf8');
  const modelCount = extractModelBlocks(nextPgSource).length;
  console.log(`✅ prisma/schema.postgresql.prisma güncellendi — ${modelCount} model senkronize edildi.`);
  console.log('ℹ Mevcut bir PostgreSQL veritabanınız varsa:');
  console.log('   DATABASE_URL=postgresql://... npx prisma db push --schema=prisma/schema.postgresql.prisma');
  console.log('   ile yeni alan/tabloları veritabanına uygulayın.');
}

main();
