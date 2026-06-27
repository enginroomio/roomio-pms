#!/usr/bin/env node
/**
 * Generated mockup kataloğu — assets klasöründen rollout eşlemesi üretir.
 *
 *   node scripts/build-screen-catalog.mjs
 */
import { readdirSync, writeFileSync, readFileSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const ASSETS = process.env.ROOMIO_MOCKUP_ASSETS
  ?? join(ROOT, 'references/assets');
const OUT = join(ROOT, 'references/screen-catalog.json');
const OUT_PUBLIC = join(ROOT, 'public/screen-catalog.json');

const ROLLOUT_MAP = [
  { phase: 'shell', patterns: ['screen-000', 'roomio-final-ana-sayfa', 'roomio-ana-sayfa-v6'] },
  { phase: 'home', patterns: ['screen-000', 'roomio-final-ana-sayfa-rack', 'roomio-ana-ekran'] },
  { phase: 'sistem', patterns: ['screen-00', 'screen-01', 'screen-02', 'screen-03', 'sistem-'] },
  { phase: 'rezervasyon', patterns: ['rezervasyon-', 'roomio-grafik-f1', 'screen-31', 'screen-172'] },
  { phase: 'resepsiyon', patterns: ['resepsiyon-'] },
  { phase: 'onkasa', patterns: ['onkasa-'] },
  { phase: 'kat', patterns: ['screen-10', 'kat-'] },
  { phase: 'misafir', patterns: ['misafir-', 'banket-'] },
  { phase: 'raporlar', patterns: ['raporlar-', 'screen-19', 'screen-20'] },
  { phase: 'gunsonu', patterns: ['gunsonu-', 'screen-35', 'screen-36', 'screen-37', 'screen-38', 'screen-39', 'screen-40'] },
];

function phaseFor(file) {
  for (const { phase, patterns } of ROLLOUT_MAP) {
    if (patterns.some((p) => file.includes(p))) return phase;
  }
  return 'other';
}

function parseScreenId(name) {
  const m = name.match(/screen-(\d{3})/);
  return m ? Number(m[1]) : null;
}

if (!existsSync(ASSETS)) {
  console.error('Assets bulunamadı:', ASSETS);
  process.exit(1);
}

const files = readdirSync(ASSETS)
  .filter((f) => /\.(png|jpe?g|webp)$/i.test(f))
  .sort((a, b) => {
    const na = parseScreenId(a);
    const nb = parseScreenId(b);
    if (na !== null && nb !== null) return na - nb;
    if (na !== null) return -1;
    if (nb !== null) return 1;
    return a.localeCompare(b);
  });

const screens = files.map((file) => {
  const id = parseScreenId(file);
  return {
    file,
    url: `/mockups/${file}`,
    screenId: id,
    phase: phaseFor(file),
    slug: file.replace(/\.(png|jpe?g|webp)$/i, ''),
  };
});

const queue = existsSync(join(ASSETS, 'roomio-screen-queue.json'))
  ? JSON.parse(readFileSync(join(ASSETS, 'roomio-screen-queue.json'), 'utf8'))
  : null;

const catalog = {
  generatedAt: new Date().toISOString(),
  assetsPath: ASSETS,
  publicBase: '/mockups/',
  total: screens.length,
  queue,
  byPhase: Object.fromEntries(
    ROLLOUT_MAP.map(({ phase }) => [phase, screens.filter((s) => s.phase === phase).length]),
  ),
  screens,
};

writeFileSync(OUT, JSON.stringify(catalog, null, 2));
writeFileSync(OUT_PUBLIC, JSON.stringify(catalog, null, 2));
console.log(`Katalog: ${screens.length} görüntü → ${OUT}`);
