#!/usr/bin/env node
/**
 * Ücretsiz HTTPS tünel — GitHub/Render olmadan telefon push testi.
 * Kullanım: npm run tunnel:https
 */
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { join } from 'node:path';
import { spawn, spawnSync } from 'node:child_process';

function activePort() {
  try {
    return readFileSync(join(process.cwd(), '.roomio/runtime/active-port.txt'), 'utf8').trim();
  } catch {
    return '3171';
  }
}

const port = process.env.ROOMIO_PORT ?? activePort();
const local = `http://127.0.0.1:${port}`;

console.log(`\n── HTTPS tünel (${local}) ──\n`);

const health = spawnSync('curl', ['-sf', `${local}/api/health`], { encoding: 'utf8' });
if (health.status !== 0) {
  console.error('✗ Yerel sunucu ayakta değil — önce: cd ~/Projects/roomio-pms && npm run restart');
  process.exit(1);
}
console.log('✓ Yerel sunucu ayakta');

function saveUrl(url) {
  mkdirSync(join(process.cwd(), '.roomio'), { recursive: true });
  mkdirSync(join(process.cwd(), '.roomio', 'runtime'), { recursive: true });
  writeFileSync(join(process.cwd(), '.roomio/production-url.txt'), `${url}\n`, 'utf8');
  writeFileSync(join(process.cwd(), '.roomio/runtime/windows-url.txt'), `${url}\n`, 'utf8');
  console.log(`\n✅ Windows / dış erişim URL kaydedildi → .roomio/runtime/windows-url.txt`);
  console.log(`\n📱 Tarayıcı (Windows): ${url}`);
  console.log(`   Grafikler: ${url}/reservations/calendar`);
  console.log(`\nTest: ROOMIO_PRODUCTION_URL=${url} npm run test:faz11 -- --step 11.3\n`);
}

// cloudflared tercih
const cf = spawnSync('cloudflared', ['--version'], { encoding: 'utf8' });
if (cf.status === 0) {
  console.log('ℹ cloudflared başlatılıyor…');
  const proc = spawn('cloudflared', ['tunnel', '--url', local], { stdio: ['ignore', 'pipe', 'pipe'] });
  proc.stdout.on('data', (buf) => {
    const line = buf.toString();
    process.stdout.write(line);
    const m = line.match(/https:\/\/[a-z0-9-]+\.trycloudflare\.com/);
    if (m) saveUrl(m[0]);
  });
  proc.stderr.on('data', (buf) => {
    const line = buf.toString();
    process.stderr.write(line);
    const m = line.match(/https:\/\/[a-z0-9-]+\.trycloudflare\.com/);
    if (m) saveUrl(m[0]);
  });
  proc.on('exit', (code) => process.exit(code ?? 0));
} else {
  // localtunnel yedek
  console.log('ℹ cloudflared yok — localtunnel deneniyor (npx)…');
  const lt = spawn('npx', ['--yes', 'localtunnel', '--port', port], { stdio: ['ignore', 'pipe', 'pipe'] });
  lt.stdout.on('data', (buf) => {
    const line = buf.toString();
    process.stdout.write(line);
    const m = line.match(/https:\/\/[^\s]+\.loca\.lt/);
    if (m) saveUrl(m[0].replace(/[^\w:/.-]/g, ''));
  });
  lt.stderr.pipe(process.stderr);
  lt.on('exit', (code) => process.exit(code ?? 0));
}
