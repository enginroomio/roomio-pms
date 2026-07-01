#!/usr/bin/env node
/**
 * Geliştirme sunucusu — varsayılan 127.0.0.1 (CSS/JS cross-origin sorunu olmaz).
 * LAN / Windows: npm run dev:lan  (ROOMIO_HOST=0.0.0.0)
 */
import { spawn } from 'node:child_process';
import { execSync } from 'node:child_process';
import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const PORT = process.env.ROOMIO_PORT ?? '3100';
const HOST = process.env.ROOMIO_HOST ?? '127.0.0.1';

function lanIp() {
  if (process.platform === 'win32') {
    try {
      const out = execSync('powershell -NoProfile -Command "(Get-NetIPAddress -AddressFamily IPv4 | Where-Object { $_.InterfaceAlias -notmatch \"Loopback|vEthernet|WSL\" -and $_.IPAddress -notmatch \"^169\\.\" } | Select-Object -First 1).IPAddress"', {
        encoding: 'utf8',
      }).trim();
      return out || null;
    } catch {
      return null;
    }
  }
  for (const iface of ['en0', 'en1', 'en5']) {
    try {
      const ip = execSync(`ipconfig getifaddr ${iface}`, { encoding: 'utf8' }).trim();
      if (ip) return ip;
    } catch {
      // next
    }
  }
  return null;
}

const ip = lanIp();
const runtimeDir = join(ROOT, '.roomio', 'runtime');
mkdirSync(runtimeDir, { recursive: true });

const lines = [
  `http://127.0.0.1:${PORT}`,
  ip ? `http://${ip}:${PORT}` : null,
].filter(Boolean);

writeFileSync(join(runtimeDir, 'lan-url.txt'), `${lines.join('\n')}\n`, 'utf8');
writeFileSync(join(runtimeDir, 'active-port.txt'), `${PORT}\n`, 'utf8');

console.log('\n════════════════════════════════════════');
console.log('  Roomio dev — erişim adresleri');
console.log(`  Mac / bu bilgisayar: http://127.0.0.1:${PORT}`);
if (HOST === '0.0.0.0' && ip) {
  console.log(`  Windows / LAN:       http://${ip}:${PORT}`);
} else if (HOST === '0.0.0.0') {
  console.log('  Windows / LAN:       (IP bulunamadı — aynı ağda ipconfig/ifconfig ile bakın)');
} else {
  console.log(`  LAN erişimi:         npm run dev:lan`);
}
console.log('  Proxy hatası:        npm run share  (HTTPS tünel)');
console.log('════════════════════════════════════════\n');

const nextBin = join(ROOT, 'node_modules', 'next', 'dist', 'bin', 'next');
const env = {
  ...process.env,
  WATCHPACK_POLLING: process.env.WATCHPACK_POLLING ?? 'true',
};

const child = spawn(
  process.execPath,
  [nextBin, 'dev', '-p', PORT, '-H', HOST],
  { cwd: ROOT, stdio: 'inherit', env },
);

child.on('exit', (code) => process.exit(code ?? 0));
