#!/usr/bin/env node
/**
 * Port seçimi ve sunucu doğrulama — eski/zombie süreçler 3100'de takılı kalınca
 * otomatik boş port bulur ve JS chunk'larının yüklendiğini doğrular.
 */
import { execSync } from 'node:child_process';
import { existsSync, mkdirSync, readFileSync, readdirSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import net from 'node:net';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const HOST = process.env.ROOMIO_HOST ?? '127.0.0.1';
const PREFERRED = Number(process.env.ROOMIO_PORT ?? 3100);
const PORT_END = Number(process.env.ROOMIO_PORT_END ?? 3220);
const RUNTIME_DIR = join(ROOT, '.roomio', 'runtime');
export const PORT_FILE = join(RUNTIME_DIR, 'active-port.txt');

export function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

export function portFree(port) {
  return new Promise((resolve) => {
    const server = net.createServer();
    server.once('error', () => resolve(false));
    server.listen(port, HOST, () => server.close(() => resolve(true)));
  });
}

export function killPort(port) {
  if (process.platform === 'win32') {
    try {
      execSync(`for /f "tokens=5" %a in ('netstat -ano ^| findstr :${port}') do taskkill /F /PID %a`, {
        stdio: 'ignore',
        shell: true,
      });
    } catch {
      // ignore
    }
    return;
  }

  try {
    const out = execSync(`lsof -ti:${port}`, { encoding: 'utf8' }).trim();
    if (!out) return;
    for (const pid of out.split(/\s+/)) {
      if (!pid) continue;
      try {
        process.kill(Number(pid), 'SIGKILL');
      } catch {
        try {
          execSync(`kill -9 ${pid}`, { stdio: 'ignore', shell: true });
        } catch {
          // ignore — kullanıcı Activity Monitor'dan kapatabilir
        }
      }
    }
  } catch {
    // port boş
  }
}

export async function pickPort(preferred = PREFERRED) {
  killPort(preferred);
  await sleep(800);
  if (await portFree(preferred)) return preferred;

  console.warn(`[port] ${preferred} meşgul (eski sunucu takılı olabilir) — boş port aranıyor…`);
  for (let p = preferred + 1; p <= PORT_END; p++) {
    if (await portFree(p)) return p;
  }
  throw new Error(`Boş port bulunamadı (${preferred}–${PORT_END})`);
}

export function writeActivePort(port) {
  mkdirSync(RUNTIME_DIR, { recursive: true });
  writeFileSync(PORT_FILE, String(port), 'utf8');
}

export function readActivePort() {
  if (!existsSync(PORT_FILE)) return PREFERRED;
  const n = Number(readFileSync(PORT_FILE, 'utf8').trim());
  return Number.isFinite(n) ? n : PREFERRED;
}

async function portResponds(port) {
  const baseUrl = `http://${HOST}:${port}`;
  try {
    const res = await fetch(`${baseUrl}/api/health`, { signal: AbortSignal.timeout(1500) });
    return res.ok;
  } catch {
    return false;
  }
}

export function readLocalBuildId() {
  const file = join(ROOT, '.next', 'BUILD_ID');
  if (!existsSync(file)) return null;
  return readFileSync(file, 'utf8').trim() || null;
}

/** RoomRackGrid chunk adı — diskteki güncel build imzası */
export function localRackChunkToken() {
  const dir = join(ROOT, '.next', 'static', 'chunks');
  if (!existsSync(dir)) return null;
  const match = readdirSync(dir).find((f) => /^3383-[a-f0-9]+\.js$/.test(f));
  return match?.replace(/\.js$/, '') ?? null;
}

export async function verifyServerBuild(baseUrl) {
  const token = localRackChunkToken();
  if (!token) return;

  const res = await fetch(`${baseUrl}/`);
  if (!res.ok) throw new Error(`Ana sayfa HTTP ${res.status}`);
  const html = await res.text();
  if (!html.includes(token)) {
    throw new Error(`Eski sunucu build (beklenen ${token})`);
  }
}

export async function verifyCanaryRoutes(baseUrl) {
  const probes = [
    { path: '/housekeeping/mobile', statuses: [200] },
    { path: '/housekeeping/operations', statuses: [200] },
    { path: '/housekeeping/faults', statuses: [200] },
    { path: '/housekeeping/reports', statuses: [200] },
    { path: '/api/housekeeping/faults', statuses: [200] },
    { path: '/api/housekeeping/requests', statuses: [200] },
    { path: '/api/push/vapid-public-key', statuses: [200] },
    { path: '/api/integrations/status', statuses: [200] },
    { path: '/api/monitoring/status', statuses: [200] },
    {
      path: '/api/push/send',
      method: 'POST',
      body: '{}',
      headers: { 'Content-Type': 'application/json' },
      statuses: [503],
    },
  ];
  for (const probe of probes) {
    const res = await fetch(`${baseUrl}${probe.path}`, {
      method: probe.method ?? 'GET',
      headers: probe.headers,
      body: probe.body,
      signal: AbortSignal.timeout(2500),
    });
    if (!probe.statuses.includes(res.status)) {
      throw new Error(`Eski sunucu: ${probe.path} → HTTP ${res.status}`);
    }
  }
}

/** Çalışan (güncel build + JS 200) Roomio sunucusu arar. */
export async function findWorkingPort(start = PREFERRED, end = PORT_END) {
  const candidates = [readActivePort(), start];
  for (let p = start; p <= end; p++) candidates.push(p);

  for (const port of [...new Set(candidates)]) {
    if (!Number.isFinite(port)) continue;
    if (!(await portResponds(port))) continue;
    const baseUrl = `http://${HOST}:${port}`;
    try {
      await verifyHomeAssets(baseUrl);
      return port;
    } catch {
      // bozuk/eski sunucu
    }
  }
  return null;
}

export async function resolveRoomioUrl() {
  const port = (await findWorkingPort()) ?? readActivePort();
  return `http://${HOST}:${port}/`;
}

export async function waitForHealth(baseUrl, timeoutMs = 90_000) {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    try {
      const res = await fetch(`${baseUrl}/api/health`);
      if (res.ok) return;
    } catch {
      // retry
    }
    await sleep(400);
  }
  throw new Error(`Sunucu yanıt vermedi: ${baseUrl}/api/health`);
}

/** Ana sayfa HTML'indeki en az bir JS chunk'ının 200 döndüğünü doğrular. */
export async function verifyHomeAssets(baseUrl) {
  const res = await fetch(`${baseUrl}/`);
  if (!res.ok) throw new Error(`Ana sayfa HTTP ${res.status}`);

  const html = await res.text();
  const cssFiles = [...html.matchAll(/\/_next\/static\/css\/[^"'\s>]+\.css/g)].map((m) => m[0]);
  const chunks = [...html.matchAll(/\/_next\/static\/chunks\/[^"'\s>]+\.js/g)].map((m) => m[0]);
  if (cssFiles.length === 0 && chunks.length === 0) {
    throw new Error('Ana sayfada CSS/JS bulunamadı');
  }

  const assets = [...new Set([...cssFiles.slice(0, 2), ...chunks.slice(0, 4)])];
  const failed = [];
  for (const asset of assets) {
    const check = await fetch(`${baseUrl}${asset}`);
    if (!check.ok) failed.push(`${asset} → ${check.status}`);
  }

  if (failed.length === assets.length) {
    throw new Error(
      `Stil/script yüklenemiyor (eski sunucu). Örnek: ${failed[0]}`,
    );
  }

  await verifyServerBuild(baseUrl);
  await verifyCanaryRoutes(baseUrl);
}

export async function preparePort(preferred = PREFERRED) {
  const port = await pickPort(preferred);
  writeActivePort(port);
  if (port !== preferred) {
    console.warn(`[port] UYARI: http://${HOST}:${preferred} eski/hatalı sunucu olabilir.`);
    console.warn(`[port] Roomio şu adreste açılacak: http://${HOST}:${port}/`);
  }
  return port;
}

/** Eski/zombie sunucuları kapatır; güncel portu döndürür (yoksa null). */
export async function pruneStaleServers(start = PREFERRED, end = PORT_END) {
  let kept = null;
  for (let port = start; port <= end; port += 1) {
    if (!(await portResponds(port))) continue;
    const baseUrl = `http://${HOST}:${port}`;
    let current = false;
    try {
      await verifyCanaryRoutes(baseUrl);
      await verifyServerBuild(baseUrl);
      current = true;
    } catch {
      current = false;
    }
    if (current) {
      kept = port;
      continue;
    }
    try {
      killPort(port);
      await sleep(300);
      console.log(`[prune] Eski sunucu kapatıldı (port ${port})`);
    } catch {
      console.warn(`[prune] Port ${port} kapatılamadı — atlanıyor`);
    }
  }
  if (kept) writeActivePort(kept);
  return kept;
}

export function baseUrlForPort(port) {
  return `http://${HOST}:${port}/`;
}

/** Güncel sunucu yoksa arka planda başlatır; port döndürür. */
export async function ensureRoomioServer(options = {}) {
  const { prune = false } = options;
  if (prune) await pruneStaleServers();

  let port = await findWorkingPort();
  if (port) {
    writeActivePort(port);
    return port;
  }

  console.log('[ensure] Güncel sunucu yok — build + start…');
  try {
    execSync('node scripts/roomio-kill-ports.mjs', { cwd: ROOT, stdio: 'inherit' });
  } catch {
    // ignore
  }
  execSync('npm run db:push', { cwd: ROOT, stdio: 'inherit' });
  execSync('npm run build', { cwd: ROOT, stdio: 'inherit' });
  execSync('node scripts/write-release-manifest.mjs', { cwd: ROOT, stdio: 'inherit' });
  const { syncStandaloneAssets } = await import('./sync-standalone-assets.mjs');
  syncStandaloneAssets();

  port = await preparePort(PREFERRED);
  const nextBin = join(ROOT, 'node_modules', 'next', 'dist', 'bin', 'next');
  const { spawn } = await import('node:child_process');
  const { roomioDatabaseUrl } = await import('./roomio-db-url.mjs');
  const dbUrl = roomioDatabaseUrl();
  const standaloneServer = join(ROOT, '.next', 'standalone', 'server.js');
  const useStandalone = existsSync(standaloneServer);
  const child = useStandalone
    ? spawn(process.execPath, [standaloneServer], {
        cwd: join(ROOT, '.next', 'standalone'),
        detached: true,
        stdio: 'ignore',
        env: { ...process.env, NODE_ENV: 'production', PORT: String(port), HOSTNAME: HOST, DATABASE_URL: dbUrl },
      })
    : spawn(process.execPath, [nextBin, 'start', '-H', HOST, '-p', String(port)], {
        cwd: ROOT,
        detached: true,
        stdio: 'ignore',
        env: { ...process.env, NODE_ENV: 'production', DATABASE_URL: dbUrl },
      });
  child.unref();

  const baseUrl = baseUrlForPort(port);
  await waitForHealth(baseUrl);
  await verifyHomeAssets(baseUrl);
  writeActivePort(port);
  console.log(`[ensure] Sunucu hazır → ${baseUrl}`);
  return port;
}
