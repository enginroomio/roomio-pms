#!/usr/bin/env node
/**
 * Tamamlanan ekran mockup PNG'lerini siler (canlı UI mevcut).
 * public/mockups ↔ references/assets hardlink — tek silme yeterli.
 *
 *   node scripts/cleanup-completed-mockups.mjs          # dry-run
 *   node scripts/cleanup-completed-mockups.mjs --apply  # sil
 */
import { readdirSync, statSync, unlinkSync } from 'node:fs';
import { join } from 'node:path';

const ROOT = join(import.meta.dirname, '..');
const MOCK_DIR = join(ROOT, 'public/mockups');
const apply = process.argv.includes('--apply');

const HOME_ROLLOUT = new Set([
  'roomio-final-ana-sayfa-rack.png',
  'roomio-ana-sayfa-v6-filled-top.png',
  'roomio-ana-sayfa-arda-v2-welcome.png',
  'dashboard-single-floor-rack-mockup.png',
  'room-rack-cell-alternatives.png',
]);

function shouldDelete(name) {
  if (!/\.png$/i.test(name)) return false;
  if (/^screen-/.test(name)) return true;
  if (name.startsWith('roomio-grafik-f1')) return true;
  if (/^pms-menu-/.test(name)) return true;
  if (HOME_ROLLOUT.has(name)) return true;
  return false;
}

const files = readdirSync(MOCK_DIR).filter(shouldDelete);
const bytes = files.reduce((s, f) => s + statSync(join(MOCK_DIR, f)).size, 0);

console.log(`${apply ? 'SİL' : 'DRY-RUN'} — ${files.length} dosya · ${(bytes / 1024 / 1024).toFixed(1)} MB`);
for (const f of files.sort()) {
  console.log(`  ${apply ? '✗' : '·'} ${f}`);
}

if (apply) {
  for (const f of files) unlinkSync(join(MOCK_DIR, f));
  console.log(`\nSilindi: ${files.length} dosya`);
} else {
  console.log('\nUygulamak için: node scripts/cleanup-completed-mockups.mjs --apply');
}
