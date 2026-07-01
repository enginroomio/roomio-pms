#!/usr/bin/env node
/**
 * Orijinal ana sayfa şablonları — statik doğrulama (Playwright gerektirmez).
 *   node scripts/validate-home-orijinal.mjs
 */
import { readFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';

const ROOT = process.cwd();
const errors = [];

function ok(msg) {
  console.log(`✓ ${msg}`);
}

function fail(msg) {
  errors.push(msg);
  console.log(`✗ ${msg}`);
}

const layoutSrc = readFileSync(join(ROOT, 'lib/dashboard/home-layout.ts'), 'utf8');
const archiveSrc = readFileSync(join(ROOT, 'lib/dashboard/home-templates.ts'), 'utf8');
const cssSrc = readFileSync(join(ROOT, 'app/styles/dashboard.css'), 'utf8');

for (const id of ['orijinal-operasyon', 'orijinal-kompakt', 'orijinal-klasik']) {
  if (!layoutSrc.includes(`id: '${id}'`)) fail(`HOME_PRESETS eksik: ${id}`);
  else ok(`preset ${id}`);
}

if (!archiveSrc.includes("migrateHomeLayoutForOrijinalDefault")) {
  fail('orijinal varsayılan migrasyon eksik');
} else {
  ok('orijinal varsayılan migrasyon');
}

if (!layoutSrc.includes('shouldMigrateToOrijinalLayout')) {
  fail('shouldMigrateToOrijinalLayout eksik');
} else {
  ok('legacy ana-ekran migrasyon kuralı');
}

if (!layoutSrc.includes("presetId: 'orijinal-operasyon'")) {
  fail('DEFAULT_HOME_LAYOUT orijinal-operasyon değil');
} else {
  ok('DEFAULT_HOME_LAYOUT → orijinal-operasyon');
}

for (const name of ['Orijinal · Operasyon Paneli', 'Orijinal · Kompakt', 'Orijinal · Klasik']) {
  if (!archiveSrc.includes(name)) fail(`Arşiv eksik: ${name}`);
  else ok(`arşiv ${name}`);
}

if (!cssSrc.includes('.roomio-dashboard--theme-orijinal')) {
  fail('orijinal tema CSS eksik');
} else {
  ok('orijinal tema CSS');
}

const mockRef = join(ROOT, 'references/mockups/otel-pms-orijinal-tarayici.html');
const mockPub = join(ROOT, 'public/mockups/otel-pms-orijinal-tarayici.html');
if (!existsSync(mockRef)) fail('references mockup eksik');
else ok('references mockup');
if (!existsSync(mockPub)) fail('public mockup eksik');
else ok('public mockup');

const panelHub = readFileSync(join(ROOT, 'components/panel/PanelHubPanels.tsx'), 'utf8');
if (!panelHub.includes('/?design=1')) fail('Panel hub Ana Ekran Dizayn linki eksik');
else ok('panel hub → /?design=1');

const sidebar = readFileSync(join(ROOT, 'lib/navigation/sidebar-submenus.ts'), 'utf8');
if (!sidebar.includes("sub('Ana Ekran Dizayn', '/?design=1')")) fail('sidebar Ana Ekran Dizayn linki eksik');
else ok('sidebar → /?design=1');

if (errors.length) {
  console.log(`\n${errors.length} hata`);
  process.exit(1);
}
console.log('\n✓ Orijinal ana sayfa şablonları doğrulandı\n');
