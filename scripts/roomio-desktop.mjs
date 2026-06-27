#!/usr/bin/env node
/**
 * Roomio masaüstü başlatıcı:
 * - Güncel build alır
 * - Tarayıcıyı uygulama modunda açar (Chrome, Edge, Safari)
 * - Pencere kapanınca sunucuyu durdurur ve oturum belleğini temizler
 *
 * Tarayıcı seçimi:
 *   ROOMIO_BROWSER=auto|chrome|edge|safari  (varsayılan: auto)
 */
import { spawn, execSync } from 'node:child_process';
import { existsSync, mkdirSync, openSync, rmSync, readFileSync, writeFileSync } from 'node:fs';
import { homedir } from 'node:os';
import { basename, dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { preparePort, verifyHomeAssets, waitForHealth as waitServerHealth, writeActivePort } from './roomio-port.mjs';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const HOST = process.env.ROOMIO_HOST ?? '127.0.0.1';
const PREFERRED_PORT = Number(process.env.ROOMIO_PORT ?? 3100);
let ACTIVE_PORT = PREFERRED_PORT;
const BROWSER_PREF = (process.env.ROOMIO_BROWSER ?? 'auto').toLowerCase();
const RUNTIME_DIR = join(ROOT, '.roomio', 'runtime');
const PROFILE_DIR = join(RUNTIME_DIR, 'browser-profile');
const PID_FILE = join(RUNTIME_DIR, 'server.pid');
const NEXT_BIN = join(ROOT, 'node_modules', 'next', 'dist', 'bin', 'next');
const BUILD_ID_FILE = join(ROOT, '.next', 'BUILD_ID');

const CHROMIUM_CANDIDATES = {
  darwin: [
    {
      id: 'chrome',
      label: 'Google Chrome',
      bundleId: 'com.google.Chrome',
      appName: 'Google Chrome',
      paths: [
        '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
        join(homedir(), 'Applications/Google Chrome.app/Contents/MacOS/Google Chrome'),
      ],
    },
    {
      id: 'edge',
      label: 'Microsoft Edge',
      bundleId: 'com.microsoft.edgemac',
      appName: 'Microsoft Edge',
      paths: ['/Applications/Microsoft Edge.app/Contents/MacOS/Microsoft Edge'],
    },
    {
      id: 'chromium',
      label: 'Chromium',
      bundleId: 'org.chromium.Chromium',
      appName: 'Chromium',
      paths: ['/Applications/Chromium.app/Contents/MacOS/Chromium'],
    },
  ],
  win32: [
    {
      id: 'chrome',
      label: 'Google Chrome',
      paths: [join(process.env.PROGRAMFILES ?? 'C:\\Program Files', 'Google', 'Chrome', 'Application', 'chrome.exe')],
    },
    {
      id: 'edge',
      label: 'Microsoft Edge',
      paths: [join(process.env.PROGRAMFILES ?? 'C:\\Program Files', 'Microsoft', 'Edge', 'Application', 'msedge.exe')],
    },
  ],
};

function resolveExecutablePath(candidate) {
  if (candidate.path && existsSync(candidate.path)) return candidate.path;
  for (const path of candidate.paths ?? []) {
    if (existsSync(path)) return path;
  }
  if (process.platform === 'darwin' && candidate.bundleId) {
    try {
      const appBundle = runCapture(`mdfind "kMDItemCFBundleIdentifier == '${candidate.bundleId}'" | head -1`);
      if (appBundle) {
        const appName = candidate.appName ?? basename(appBundle, '.app');
        const bin = join(appBundle, 'Contents/MacOS', appName);
        if (existsSync(bin)) return bin;
      }
    } catch {
      // ignore
    }
  }
  return null;
}

function findChromium(preferredId) {
  const list = CHROMIUM_CANDIDATES[process.platform] ?? [];
  if (preferredId && preferredId !== 'auto' && preferredId !== 'safari') {
    const spec = list.find((b) => b.id === preferredId);
    if (spec) {
      const path = resolveExecutablePath(spec);
      if (path) return { id: spec.id, label: spec.label, path };
    }
    if (preferredId !== 'auto') {
      console.warn(`[desktop] ${preferredId} bulunamadı, diğer tarayıcılar deneniyor…`);
    }
  }
  for (const candidate of list) {
    const path = resolveExecutablePath(candidate);
    if (path) return { id: candidate.id, label: candidate.label, path };
  }
  return null;
}

const SAFARI_APP = '/Applications/Safari.app';

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

function banner(title) {
  console.log('\n════════════════════════════════════════');
  console.log(`  ${title}`);
  console.log('════════════════════════════════════════\n');
}

function runSync(cmd, args, opts = {}) {
  execSync([cmd, ...args].join(' '), {
    cwd: ROOT,
    stdio: 'inherit',
    shell: true,
    ...opts,
  });
}

function runCapture(cmd) {
  return execSync(cmd, { cwd: ROOT, encoding: 'utf8', shell: true }).trim();
}

async function waitForHealth(url, timeoutMs = 120_000) {
  return waitServerHealth(url.replace(/\/api\/health$/, ''), timeoutMs);
}

function safariNeedle() {
  return `${HOST}:${ACTIVE_PORT}`;
}

function safariInstalled() {
  return process.platform === 'darwin' && existsSync(SAFARI_APP);
}

function resolveBrowser() {
  if (BROWSER_PREF === 'safari') {
    if (!safariInstalled()) throw new Error('Safari bulunamadı (/Applications/Safari.app)');
    return { kind: 'safari', label: 'Safari' };
  }

  if (BROWSER_PREF === 'chrome' || BROWSER_PREF === 'edge' || BROWSER_PREF === 'chromium') {
    const hit = findChromium(BROWSER_PREF);
    if (hit) return { kind: 'chromium', ...hit };
    if (BROWSER_PREF === 'chrome') {
      throw new Error('Google Chrome bulunamadı. https://www.google.com/chrome/ adresinden yükleyin.');
    }
    throw new Error(`${BROWSER_PREF} bulunamadı`);
  }

  const chromium = findChromium('auto');
  if (chromium) return { kind: 'chromium', ...chromium };
  if (safariInstalled()) return { kind: 'safari', label: 'Safari' };
  return null;
}

function runAppleScript(source) {
  return execSync('osascript', { input: source, encoding: 'utf8' }).trim();
}

function safariTabCount() {
  const needle = safariNeedle();
  const script = `tell application "Safari"
  set n to 0
  repeat with w in windows
    repeat with t in tabs of w
      if (URL of t) contains "${needle}" then set n to n + 1
    end repeat
  end repeat
  return n
end tell`;
  try {
    return Number(runAppleScript(script)) || 0;
  } catch {
    return 0;
  }
}

function closeSafariSession() {
  const needle = safariNeedle();
  const script = `tell application "Safari"
  repeat with w in windows
    set tabList to tabs of w
    repeat with i from (count of tabList) to 1 by -1
      set t to item i of tabList
      if (URL of t) contains "${needle}" then close t
    end repeat
  end repeat
end tell`;
  try {
    runAppleScript(script);
  } catch {
    // ignore
  }
}

function openSafari(url) {
  execSync(`open -a Safari ${JSON.stringify(url)}`, { shell: true, stdio: 'ignore' });
}

async function waitSafariSession() {
  await sleep(800);
  while (safariTabCount() > 0) {
    await sleep(900);
  }
}

function chromiumProfileRunning() {
  try {
    const needle = PROFILE_DIR.replace(/\\/g, '\\\\');
    if (process.platform === 'win32') {
      const out = runCapture(`wmic process where "CommandLine like '%${needle}%'" get ProcessId 2>nul`);
      return /[0-9]/.test(out);
    }
    const out = runCapture(`pgrep -lf "${PROFILE_DIR}" || true`);
    return out.length > 0;
  } catch {
    return false;
  }
}

function launchChromiumApp(browser, url) {
  mkdirSync(PROFILE_DIR, { recursive: true });
  const args = [
    `--app=${url}`,
    `--user-data-dir=${PROFILE_DIR}`,
    '--no-first-run',
    '--no-default-browser-check',
    '--disable-session-crashed-bubble',
    '--disable-infobars',
    '--no-proxy-server',
    '--proxy-bypass-list=<-loopback>,127.0.0.1,localhost',
  ];

  if (process.platform === 'darwin') {
    try {
      return spawn(browser.path, args, { stdio: 'ignore', detached: false });
    } catch {
      const quoted = args.map((a) => `'${a.replace(/'/g, "'\\''")}'`).join(' ');
      execSync(`open -na "Google Chrome" --args ${quoted}`, { stdio: 'ignore', shell: true });
      return null;
    }
  }

  return spawn(browser.path, args, { stdio: 'ignore', detached: false });
}

async function waitChromiumSession() {
  await sleep(800);
  while (chromiumProfileRunning()) {
    await sleep(900);
  }
}

function hasProductionBuild() {
  return existsSync(BUILD_ID_FILE) && existsSync(join(ROOT, '.next', 'server'));
}

function ensureProductionBuild() {
  if (process.env.ROOMIO_FORCE_BUILD !== '1' && hasProductionBuild()) {
    console.log('[desktop] Mevcut production build kullanılıyor…');
    return;
  }

  console.log('[desktop] Production build alınıyor…');
  try {
    runSync('npm', ['run', 'build']);
  } catch {
    console.warn('[desktop] Build hatası — .next temizlenip yeniden deneniyor…');
    rmSync(join(ROOT, '.next'), { recursive: true, force: true });
    runSync('npm', ['run', 'build']);
  }
}

function launchBrowserApp(browser, url) {
  console.log(`[desktop] Tarayıcı: ${browser.label}`);

  if (browser.kind === 'safari') {
    openSafari(url);
    return { kind: 'safari' };
  }

  launchChromiumApp(browser, url);
  return { kind: 'chromium' };
}

async function waitForBrowserExit(handle) {
  if (handle.kind === 'safari') {
    await waitSafariSession();
    return;
  }

  await waitChromiumSession();
}

function cleanupRuntime(killServerPid) {
  console.log('[desktop] Bellek ve oturum temizleniyor…');

  if (killServerPid) {
    try {
      process.kill(killServerPid, 'SIGTERM');
    } catch {
      // already dead
    }
    try {
      process.kill(killServerPid, 'SIGKILL');
    } catch {
      // ignore
    }
  }

  try {
    execSync('node scripts/roomio-kill-ports.mjs', { cwd: ROOT, stdio: 'pipe', shell: true });
  } catch {
    // ignore
  }

  closeSafariSession();

  try {
    rmSync(PROFILE_DIR, { recursive: true, force: true });
  } catch {
    // ignore
  }

  try {
    rmSync(PID_FILE, { force: true });
  } catch {
    // ignore
  }

  console.log('[desktop] Temizlik tamamlandı.');
}

function startServer(port) {
  if (!existsSync(NEXT_BIN)) {
    throw new Error('Next.js bulunamadı. Proje klasöründe npm install çalıştırın.');
  }

  const logFile = join(RUNTIME_DIR, 'server.log');
  mkdirSync(RUNTIME_DIR, { recursive: true });
  const logFd = openSync(logFile, 'a');

  const child = spawn(process.execPath, [NEXT_BIN, 'start', '-H', HOST, '-p', String(port)], {
    cwd: ROOT,
    stdio: ['ignore', logFd, logFd],
    detached: false,
    env: { ...process.env, NODE_ENV: 'production' },
  });

  writeFileSync(PID_FILE, String(child.pid), 'utf8');
  return child;
}

function readPidFile() {
  if (!existsSync(PID_FILE)) return null;
  const n = Number(readFileSync(PID_FILE, 'utf8').trim());
  return Number.isFinite(n) ? n : null;
}

async function main() {
  banner('Roomio PMS — Masaüstü Başlatıcı');

  const browser = resolveBrowser();
  if (!browser) {
    throw new Error('Tarayıcı bulunamadı. Chrome, Edge veya Safari (macOS) gerekli.');
  }

  let serverPid = readPidFile();
  cleanupRuntime(serverPid);
  serverPid = null;

  console.log('[desktop] Eski süreçler kapatılıyor…');
  runSync('node', ['scripts/roomio-kill-ports.mjs']);
  await sleep(1000);

  ACTIVE_PORT = await preparePort(PREFERRED_PORT);
  writeActivePort(ACTIVE_PORT);

  console.log('[desktop] Veritabanı senkronu…');
  runSync('npm', ['run', 'db:push']);

  ensureProductionBuild();

  runSync('node', ['scripts/write-release-manifest.mjs']);

  const manifest = JSON.parse(readFileSync(join(ROOT, 'public', 'release-manifest.json'), 'utf8'));
  const baseUrl = `http://${HOST}:${ACTIVE_PORT}`;
  const appUrl = `${baseUrl}/?launch=${encodeURIComponent(manifest.launchId)}`;

  console.log('[desktop] Sunucu başlatılıyor…');
  const server = startServer(ACTIVE_PORT);
  serverPid = server.pid;

  try {
    await waitForHealth(`${baseUrl}/api/health`);
    await verifyHomeAssets(baseUrl);
  } catch (err) {
    cleanupRuntime(serverPid);
    throw err;
  }

  if (ACTIVE_PORT !== PREFERRED_PORT) {
    console.warn(`[desktop] Port ${PREFERRED_PORT} eski/hatalı sunucu — ${baseUrl} kullanılıyor`);
  }

  banner(`Roomio hazır · ${manifest.label}`);
  console.log(`  URL → ${appUrl}`);
  console.log(`  Tarayıcı → ${browser.label}`);
  if (browser.kind === 'safari') {
    console.log('  Safari: Roomio sekmesini kapatınca uygulama durur.\n');
  } else {
    console.log('  Tarayıcı penceresini kapatınca uygulama tamamen durur.\n');
  }

  const handle = launchBrowserApp(browser, appUrl);

  await Promise.race([
    waitForBrowserExit(handle),
    new Promise((resolve) => server.on('exit', resolve)),
  ]);

  cleanupRuntime(serverPid);
  banner('Roomio kapatıldı — bellek temizlendi');
}

process.on('SIGINT', () => {
  cleanupRuntime(readPidFile());
  process.exit(0);
});

process.on('SIGTERM', () => {
  cleanupRuntime(readPidFile());
  process.exit(0);
});

main().catch((err) => {
  console.error('[desktop]', err.message);
  cleanupRuntime(readPidFile());
  process.exit(1);
});
