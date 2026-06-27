#!/usr/bin/env node
/**
 * Render kurulum — git hazırlığı + rehber + health test.
 * Kullanım: cd ~/Projects/roomio-pms && npm run setup:render
 */
import { existsSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import { join } from 'node:path';
import { saveProductionUrl, defaultRenderUrl, renderServiceName, waitForHealth } from './render-production.mjs';

const ROOT = process.cwd();
const EXPECTED = defaultRenderUrl(renderServiceName());

function run(cmd, args, opts = {}) {
  return spawnSync(cmd, args, { cwd: ROOT, encoding: 'utf8', ...opts });
}

function sh(label, cmd, args) {
  console.log(`\n── ${label} ──`);
  const r = spawnSync(cmd, args, { cwd: ROOT, stdio: 'inherit', shell: typeof cmd === 'string' });
  return r.status === 0;
}

console.log('\n══ Roomio Render kurulum ══\n');
console.log(`Proje: ${ROOT}`);
console.log(`URL:   ${EXPECTED}\n`);

function gitReady() {
  try {
    return spawnSync('git', ['rev-parse', '--git-dir'], { cwd: ROOT }).status === 0;
  } catch {
    return false;
  }
}

// 1. Git
if (!gitReady()) {
  if (existsSync(join(ROOT, '.git'))) {
    console.log('ℹ Bozuk .git klasörü temizleniyor…');
    run('rm', ['-rf', '.git']);
  }
  console.log('ℹ Git deposu oluşturuluyor…');
  if (run('git', ['init', '-b', 'main']).status !== 0) {
    console.error('✗ git init başarısız');
    process.exit(1);
  }
  console.log('✓ git init');
}

const status = run('git', ['status', '--porcelain']);
const dirty = status.stdout.trim().length > 0;
if (dirty || run('git', ['rev-parse', 'HEAD'], { stdio: 'ignore' }).status !== 0) {
  run('git', ['add', '-A']);
  const commit = run('git', ['commit', '-m', 'Roomio PMS — Render production deploy']);
  if (commit.status === 0) console.log('✓ Git commit oluşturuldu');
  else if (commit.stderr?.includes('nothing to commit')) console.log('✓ Git zaten güncel');
}

const remote = run('git', ['remote', 'get-url', 'origin']);
if (remote.status !== 0) {
  console.log('\n⚠ GitHub remote yok — Render için repo gerekli:');
  console.log('  1. https://github.com/new → repo adı: roomio-pms (Private OK)');
  console.log('  2. Terminal:');
  console.log('     cd ~/Projects/roomio-pms');
  console.log('     git remote add origin https://github.com/KULLANICI/roomio-pms.git');
  console.log('     git push -u origin main');
} else {
  console.log(`✓ Git remote — ${remote.stdout.trim()}`);
  console.log('ℹ Push: git push -u origin main');
}

// 2. VAPID
if (!existsSync('.env.vapid.generated')) {
  sh('VAPID üretimi', 'npm', ['run', 'vapid:gen']);
} else {
  console.log('\n✓ .env.vapid.generated mevcut');
}

// 3. Render rehber
sh('Render rehberi', 'npm', ['run', 'deploy:render']);

// 4. Health (varsa)
const prod = process.env.ROOMIO_PRODUCTION_URL?.trim() || EXPECTED;
console.log(`\n── Production health (${prod}) ──`);
const health = await waitForHealth(prod, 6, 5000);
if (health.ok) {
  saveProductionUrl(prod);
  console.log(`✅ ${prod} ayakta`);
  sh('Render test', 'npm', ['run', 'test:render']);
} else {
  console.log('ℹ Site henüz yok — Render Blueprint deploy tamamlanmadan health geçmez');
  console.log('\n📋 Sıradaki adım (siz):');
  console.log('  render.com → Sign Up (GitHub) → New → Blueprint → repo seç');
  console.log(`  Deploy bitince: cd ~/Projects/roomio-pms && ROOMIO_PRODUCTION_URL=${EXPECTED} npm run test:render`);
}
