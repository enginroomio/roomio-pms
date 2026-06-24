#!/usr/bin/env node
/**
 * Production deploy ön kontrol listesi (yerel + isteğe bağlı canlı URL).
 * Kullanım:
 *   npm run deploy:checklist
 *   ROOMIO_PUBLIC_URL=https://pms.example.com npm run deploy:checklist
 */
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { spawnSync } from 'node:child_process';

function resolveBaseUrl() {
  if (process.env.ROOMIO_PUBLIC_URL) return process.env.ROOMIO_PUBLIC_URL.replace(/\/$/, '');
  if (process.env.ROOMIO_URL) return process.env.ROOMIO_URL.replace(/\/$/, '');
  const portFile = join(process.cwd(), '.roomio/runtime/active-port.txt');
  if (existsSync(portFile)) {
    const p = readFileSync(portFile, 'utf8').trim();
    if (p) return `http://127.0.0.1:${p}`;
  }
  return 'http://127.0.0.1:3100';
}

const BASE = resolveBaseUrl();
const isProd = process.env.NODE_ENV === 'production';

let ok = true;
const warn = [];

function pass(label) {
  console.log(`✓ ${label}`);
}

function fail(label, hint) {
  console.log(`✗ ${label}${hint ? ` — ${hint}` : ''}`);
  ok = false;
}

function note(label) {
  console.log(`· ${label}`);
  warn.push(label);
}

console.log('Roomio PMS — Production deploy checklist\n');

// --- Statik dosyalar ---
const requiredFiles = [
  'Dockerfile',
  'docker-compose.prod.yml',
  '.env.production.example',
  'references/PRODUCTION-DEPLOY-CHECKLIST.md',
  'middleware.ts',
  'public/sw.js',
  'public/manifest.json',
];

for (const f of requiredFiles) {
  if (existsSync(f)) pass(f);
  else fail(f, 'eksik');
}

// --- JWT / auth env (process veya .env.production) ---
let envText = '';
for (const f of ['.env.production', '.env.local', '.env']) {
  if (existsSync(f)) envText += readFileSync(f, 'utf8') + '\n';
}

const jwtFromEnv = process.env.ROOMIO_JWT_SECRET ?? '';
const jwtMatch = envText.match(/^ROOMIO_JWT_SECRET=(.+)$/m);
const jwtSecret = jwtFromEnv || (jwtMatch ? jwtMatch[1].trim() : '');

if (jwtSecret.length >= 32 && !jwtSecret.includes('replace-with')) {
  pass('ROOMIO_JWT_SECRET (≥32 karakter)');
} else if (isProd) {
  fail('ROOMIO_JWT_SECRET', 'production için güçlü secret gerekli');
} else {
  note('ROOMIO_JWT_SECRET — dev ortamında atlandı');
}

const authRequired =
  process.env.ROOMIO_AUTH_REQUIRED === '1' ||
  /^ROOMIO_AUTH_REQUIRED=1/m.test(envText) ||
  (isProd && process.env.ROOMIO_AUTH_REQUIRED !== '0');

if (authRequired || isProd) {
  pass('ROOMIO_AUTH_REQUIRED (production varsayılanı: açık)');
} else {
  note('ROOMIO_AUTH_REQUIRED=0 — geliştirme modu');
}

// --- Typecheck (hızlı güvenlik ağı) ---
const tc = spawnSync('npm', ['run', 'typecheck'], { stdio: 'pipe', shell: true, encoding: 'utf8' });
if (tc.status === 0) pass('npm run typecheck');
else fail('npm run typecheck', (tc.stderr || tc.stdout || '').split('\n').slice(-3).join(' '));

// --- Canlı URL kontrolleri ---
let checklistAuthHeaders = {};

async function obtainChecklistAuth() {
  const email = process.env.ROOMIO_CHECKLIST_EMAIL ?? 'arda@hotelsapphire.com';
  const password = process.env.ROOMIO_CHECKLIST_PASSWORD ?? 'roomio123';
  return obtainChecklistAuthWith(email, password, `checklist login (${email})`);
}

async function obtainAdminChecklistAuth() {
  const email = process.env.ROOMIO_ADMIN_EMAIL ?? 'admin@roomio.local';
  const password = process.env.ROOMIO_CHECKLIST_PASSWORD ?? 'roomio123';
  return obtainChecklistAuthWith(email, password, `admin checklist login (${email})`);
}

async function obtainViewerChecklistAuth() {
  const email = process.env.ROOMIO_VIEWER_EMAIL ?? 'viewer@hotelsapphire.com';
  const password = process.env.ROOMIO_CHECKLIST_PASSWORD ?? 'roomio123';
  return obtainChecklistAuthWith(email, password, `viewer checklist login (${email})`);
}

async function obtainHkChecklistAuth() {
  const email = process.env.ROOMIO_HK_EMAIL ?? 'hk@hotelsapphire.com';
  const password = process.env.ROOMIO_CHECKLIST_PASSWORD ?? 'roomio123';
  return obtainChecklistAuthWith(email, password, `HK checklist login (${email})`);
}

async function obtainAccountingChecklistAuth() {
  const email = process.env.ROOMIO_ACCOUNTING_EMAIL ?? 'muhasebe@hotelsapphire.com';
  const password = process.env.ROOMIO_CHECKLIST_PASSWORD ?? 'roomio123';
  return obtainChecklistAuthWith(email, password, `muhasebe checklist login (${email})`);
}

async function obtainReceptionChecklistAuth() {
  const email = process.env.ROOMIO_RECEPTION_EMAIL ?? 'reception@hotelsapphire.com';
  const password = process.env.ROOMIO_CHECKLIST_PASSWORD ?? 'roomio123';
  return obtainChecklistAuthWith(email, password, `resepsiyon checklist login (${email})`);
}

async function obtainChecklistAuthWith(email, password, passLabel) {
  if (!authRequired) return {};
  try {
    const res = await fetch(`${BASE}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
      signal: AbortSignal.timeout(15_000),
    });
    if (!res.ok) {
      note(`${passLabel} → ${res.status}`);
      return {};
    }
    const j = await res.json();
    const headers = { 'Content-Type': 'application/json' };
    if (j.token) headers.Authorization = `Bearer ${j.token}`;
    pass(passLabel);
    return headers;
  } catch (err) {
    note(`${passLabel} — ${err instanceof Error ? err.message : String(err)}`);
    return {};
  }
}

async function authFetch(path, init = {}) {
  const headers = { ...checklistAuthHeaders, ...(init.headers ?? {}) };
  return fetch(`${BASE}${path}`, { ...init, headers });
}

async function probeLive() {
  if (!BASE) {
    note('ROOMIO_PUBLIC_URL yok — canlı rota testi atlandı');
    return;
  }

  checklistAuthHeaders = await obtainChecklistAuth();

  console.log(`\nCanlı URL: ${BASE}\n`);

  async function timed(path, timeoutMs = 20_000) {
    const start = performance.now();
    const res = await authFetch(path, { signal: AbortSignal.timeout(timeoutMs) });
    const ms = Math.round(performance.now() - start);
    return { res, ms };
  }

  try {
    const { res, ms } = await timed('/api/health');
    const body = await res.json().catch(() => ({}));
    if (res.ok && body.ok === true) {
      pass(`/api/health (${ms} ms, uptime ${body.uptimeSec ?? '?'}s)`);
      if (body.checks?.auth?.ok === false) fail('health checks.auth', body.checks.auth.detail);
      else pass(`health auth: ${body.checks?.auth?.detail ?? 'ok'}`);
      if (body.checks?.performance?.detail) note(`perf: ${body.checks.performance.detail}`);
      if (ms > 8000) note(`health yavaş: ${ms} ms (soğuk başlangıç?)`);
    } else {
      fail('/api/health', `status ${res.status}`);
    }
  } catch (err) {
    fail('/api/health', err instanceof Error ? err.message : String(err));
  }

  const routes = ['/', '/login', '/offline', '/manifest.json'];
  for (const path of routes) {
    try {
      const { res, ms } = await timed(path);
      const acceptable = res.status === 200 || res.status === 307 || res.status === 308 || res.status === 302;
      if (acceptable) pass(`${path} → ${res.status} (${ms} ms)`);
      else fail(path, `status ${res.status}`);
    } catch (err) {
      fail(path, err instanceof Error ? err.message : String(err));
    }
  }

  try {
    const { res, ms } = await timed('/api/properties', 45_000);
    if (res.ok) pass(`/api/properties → ${res.status} (${ms} ms)`);
    else note(`/api/properties yavaş veya hata: ${res.status}`);
  } catch (err) {
    note(`/api/properties zaman aşımı — ${err instanceof Error ? err.message : String(err)}`);
  }

  try {
    const { res, ms } = await timed('/api/dashboard', 15_000);
    if (res.ok) {
      const j = await res.json();
      const occ = j.occupancy != null ? `${j.occupancy}%` : '?';
      pass(`/api/dashboard → ${res.status} (${ms} ms, doluluk ${occ})`);
      const cc = res.headers.get('cache-control');
      if (cc) note(`dashboard Cache-Control: ${cc}`);
    } else if (authRequired && res.status === 401) {
      fail('/api/dashboard', 'auth gerekli — checklist login kontrol edin');
    } else if (res.status === 403) {
      fail('/api/dashboard', 'reservations.read izni gerekli');
    } else {
      note(`/api/dashboard → ${res.status}`);
    }
  } catch (err) {
    note(`/api/dashboard — ${err instanceof Error ? err.message : String(err)}`);
  }

  try {
    const { res, ms } = await timed('/api/rack', 15_000);
    if (res.ok) {
      const j = await res.json();
      pass(`/api/rack → ${res.status} (${ms} ms, ${j.cells?.length ?? 0} hücre)`);
      const cc = res.headers.get('cache-control');
      if (cc) note(`rack Cache-Control: ${cc}`);
    } else if (authRequired && res.status === 401) {
      fail('/api/rack', 'auth gerekli — checklist login kontrol edin');
    } else if (res.status === 403) {
      fail('/api/rack', 'reservations.read izni gerekli');
    } else {
      note(`/api/rack → ${res.status}`);
    }
  } catch (err) {
    note(`/api/rack — ${err instanceof Error ? err.message : String(err)}`);
  }

  try {
    const { res, ms } = await timed('/api/integrations/status', 20_000);
    if (res.ok) {
      const j = await res.json();
      pass(`/api/integrations/status → ${res.status} (${ms} ms, mode ${j.mode ?? '?'})`);
    } else note(`/api/integrations/status → ${res.status}`);
  } catch (err) {
    note(`/api/integrations/status — ${err instanceof Error ? err.message : String(err)}`);
  }

  if (authRequired) {
    try {
      const start = performance.now();
      const res = await fetch(`${BASE}/api/exchange-rates`, { signal: AbortSignal.timeout(10_000) });
      const ms = Math.round(performance.now() - start);
      if (res.status === 401) pass(`exchange-rates auth'suz → 401 (${ms} ms)`);
      else note(`exchange-rates auth'suz → ${res.status}`);
    } catch (err) {
      note(`exchange-rates auth'suz — ${err instanceof Error ? err.message : String(err)}`);
    }

    try {
      const start = performance.now();
      const res = await fetch(`${BASE}/api/properties`, { signal: AbortSignal.timeout(10_000) });
      const ms = Math.round(performance.now() - start);
      if (res.status === 401) pass(`properties auth'suz → 401 (${ms} ms)`);
      else note(`properties auth'suz → ${res.status}`);
    } catch (err) {
      note(`properties auth'suz — ${err instanceof Error ? err.message : String(err)}`);
    }

    try {
      const start = performance.now();
      const res = await fetch(`${BASE}/api/dashboard`, { signal: AbortSignal.timeout(10_000) });
      const ms = Math.round(performance.now() - start);
      if (res.status === 401) pass(`dashboard auth'suz → 401 (${ms} ms)`);
      else note(`dashboard auth'suz → ${res.status}`);
    } catch (err) {
      note(`dashboard auth'suz — ${err instanceof Error ? err.message : String(err)}`);
    }

    try {
      const start = performance.now();
      const res = await fetch(`${BASE}/api/rack`, { signal: AbortSignal.timeout(10_000) });
      const ms = Math.round(performance.now() - start);
      if (res.status === 401) pass(`rack auth'suz → 401 (${ms} ms)`);
      else note(`rack auth'suz → ${res.status}`);
    } catch (err) {
      note(`rack auth'suz — ${err instanceof Error ? err.message : String(err)}`);
    }

    try {
      const start = performance.now();
      const res = await fetch(
        `${BASE}/api/reservations/availability?from=2026-06-01&days=7`,
        { signal: AbortSignal.timeout(10_000) },
      );
      const ms = Math.round(performance.now() - start);
      if (res.status === 401) pass(`availability auth'suz → 401 (${ms} ms)`);
      else note(`availability auth'suz → ${res.status}`);
    } catch (err) {
      note(`availability auth'suz — ${err instanceof Error ? err.message : String(err)}`);
    }

    try {
      const start = performance.now();
      const res = await fetch(`${BASE}/api/reservations`, { signal: AbortSignal.timeout(10_000) });
      const ms = Math.round(performance.now() - start);
      if (res.status === 401) pass(`reservations auth'suz → 401 (${ms} ms)`);
      else note(`reservations auth'suz → ${res.status}`);
    } catch (err) {
      note(`reservations auth'suz — ${err instanceof Error ? err.message : String(err)}`);
    }

    try {
      const start = performance.now();
      const res = await fetch(`${BASE}/api/folio?reservationId=checklist-unauth`, {
        signal: AbortSignal.timeout(10_000),
      });
      const ms = Math.round(performance.now() - start);
      if (res.status === 401) pass(`folio auth'suz → 401 (${ms} ms)`);
      else note(`folio auth'suz → ${res.status}`);
    } catch (err) {
      note(`folio auth'suz — ${err instanceof Error ? err.message : String(err)}`);
    }

    try {
      const start = performance.now();
      const res = await fetch(`${BASE}/api/cash?view=ledger`, { signal: AbortSignal.timeout(10_000) });
      const ms = Math.round(performance.now() - start);
      if (res.status === 401) pass(`cash auth'suz → 401 (${ms} ms)`);
      else note(`cash auth'suz → ${res.status}`);
    } catch (err) {
      note(`cash auth'suz — ${err instanceof Error ? err.message : String(err)}`);
    }

    try {
      const start = performance.now();
      const res = await fetch(`${BASE}/api/deposits`, { signal: AbortSignal.timeout(10_000) });
      const ms = Math.round(performance.now() - start);
      if (res.status === 401) pass(`deposits auth'suz → 401 (${ms} ms)`);
      else note(`deposits auth'suz → ${res.status}`);
    } catch (err) {
      note(`deposits auth'suz — ${err instanceof Error ? err.message : String(err)}`);
    }

    try {
      const start = performance.now();
      const res = await fetch(
        `${BASE}/api/compliance/5651/export?from=2026-06-01T00:00:00.000Z&to=2026-06-30T23:59:59.999Z&format=json`,
        { signal: AbortSignal.timeout(10_000) },
      );
      const ms = Math.round(performance.now() - start);
      if (res.status === 401) pass(`5651/export auth'suz → 401 (${ms} ms)`);
      else note(`5651/export auth'suz → ${res.status}`);
    } catch (err) {
      note(`5651/export auth'suz — ${err instanceof Error ? err.message : String(err)}`);
    }

    try {
      const start = performance.now();
      const res = await fetch(`${BASE}/api/integrations/status`, { signal: AbortSignal.timeout(10_000) });
      const ms = Math.round(performance.now() - start);
      if (res.status === 401) pass(`integrations/status auth'suz → 401 (${ms} ms)`);
      else note(`integrations/status auth'suz → ${res.status}`);
    } catch (err) {
      note(`integrations/status auth'suz — ${err instanceof Error ? err.message : String(err)}`);
    }
  }

  try {
    const start = performance.now();
    const res = await fetch(`${BASE}/api/locale?locale=tr`, { signal: AbortSignal.timeout(10_000) });
    const ms = Math.round(performance.now() - start);
    if (res.ok) pass(`locale herkese açık → ${res.status} (${ms} ms)`);
    else note(`locale → ${res.status}`);
  } catch (err) {
    note(`locale — ${err instanceof Error ? err.message : String(err)}`);
  }

  try {
    const start = performance.now();
    const res = await fetch(`${BASE}/api/auth/config`, { signal: AbortSignal.timeout(10_000) });
    const ms = Math.round(performance.now() - start);
    if (res.ok) pass(`auth/config herkese açık → ${res.status} (${ms} ms)`);
    else note(`auth/config → ${res.status}`);
  } catch (err) {
    note(`auth/config — ${err instanceof Error ? err.message : String(err)}`);
  }

  if (checklistAuthHeaders.Authorization) {
    try {
      const start = performance.now();
      const res = await fetch(`${BASE}/api/auth/session`, {
        headers: checklistAuthHeaders,
        signal: AbortSignal.timeout(10_000),
      });
      const ms = Math.round(performance.now() - start);
      if (res.ok) {
        const j = await res.json();
        pass(`auth/session (${ms} ms, authenticated=${j.authenticated})`);
      } else note(`auth/session → ${res.status}`);
    } catch (err) {
      note(`auth/session — ${err instanceof Error ? err.message : String(err)}`);
    }
  }

  console.log('\n── Go-live API doğrulama ──\n');

  try {
    const { res, ms } = await timed('/api/guests/archive?guestName=Marco', 15_000);
    if (res.ok) {
      const j = await res.json();
      pass(`misafir arşivi API (${ms} ms, ${j.results?.length ?? 0} sonuç)`);
    } else note(`misafir arşivi → ${res.status}`);
  } catch (err) {
    note(`misafir arşivi — ${err instanceof Error ? err.message : String(err)}`);
  }

  try {
    const { res, ms } = await timed('/api/deposits', 15_000);
    if (res.ok) {
      const j = await res.json();
      pass(`depozit API (${ms} ms, ${j.deposits?.length ?? 0} kayıt)`);
    } else note(`depozit API → ${res.status}`);
  } catch (err) {
    note(`depozit API — ${err instanceof Error ? err.message : String(err)}`);
  }

  try {
    const { res, ms } = await timed('/api/identity/notifications', 10_000);
    if (res.ok) {
      const j = await res.json();
      pass(`kimlik bildirim API (${ms} ms, ${j.notifications?.length ?? 0} kayıt)`);
    } else if (authRequired && res.status === 401) {
      note(`kimlik bildirim API → ${res.status} (identity.read + auth)`);
    } else if (res.status === 403) {
      note(`kimlik bildirim API → ${res.status} (identity.read izni)`);
    } else {
      note(`kimlik bildirim API → ${res.status}`);
    }
  } catch (err) {
    note(`kimlik bildirim API — ${err instanceof Error ? err.message : String(err)}`);
  }

  try {
    const { res, ms } = await timed('/api/egm/identity', 10_000);
    if (res.ok) {
      const j = await res.json();
      pass(`EGM kimlik API (${ms} ms, ${j.records?.length ?? 0} kayıt)`);
    } else if (res.status === 403) {
      note(`EGM kimlik API → ${res.status} (identity.read)`);
    } else {
      note(`EGM kimlik API → ${res.status}`);
    }
  } catch (err) {
    note(`EGM kimlik API — ${err instanceof Error ? err.message : String(err)}`);
  }

  try {
    const { res, ms } = await timed('/api/users', 10_000);
    if (res.ok) {
      const j = await res.json();
      pass(`kullanıcı listesi API (${ms} ms, ${j.count ?? j.users?.length ?? 0} kullanıcı)`);
    } else if (res.status === 403) {
      note(`kullanıcı listesi → ${res.status} (settings.admin veya identity.read)`);
    } else {
      note(`kullanıcı listesi → ${res.status}`);
    }
  } catch (err) {
    note(`kullanıcı listesi — ${err instanceof Error ? err.message : String(err)}`);
  }

  try {
    const adminHeaders = await obtainAdminChecklistAuth();
    if (adminHeaders.Authorization) {
      const listStart = performance.now();
      const listRes = await fetch(`${BASE}/api/users`, {
        headers: adminHeaders,
        signal: AbortSignal.timeout(10_000),
      });
      const listMs = Math.round(performance.now() - listStart);
      if (listRes.ok) {
        const list = await listRes.json();
        const adminEmail = process.env.ROOMIO_ADMIN_EMAIL ?? 'admin@roomio.local';
        const target =
          (list.users ?? []).find((u) => u.email !== adminEmail) ?? list.users?.[0];
        if (target?.id) {
          const postStart = performance.now();
          const postRes = await fetch(`${BASE}/api/users`, {
            method: 'POST',
            headers: adminHeaders,
            body: JSON.stringify({ id: target.id, department: target.department }),
            signal: AbortSignal.timeout(10_000),
          });
          const postMs = Math.round(performance.now() - postStart);
          if (postRes.ok) pass(`kullanıcı güncelleme API (admin, ${postMs} ms, liste ${listMs} ms)`);
          else if (postRes.status === 403) note(`kullanıcı güncelleme → 403 (settings.admin)`);
          else note(`kullanıcı güncelleme → ${postRes.status}`);
        } else {
          note('kullanıcı güncelleme — hedef kullanıcı yok');
        }
      } else {
        note(`admin kullanıcı listesi → ${listRes.status}`);
      }

      const bdGetStart = performance.now();
      const bdGetRes = await fetch(`${BASE}/api/business-date`, {
        headers: adminHeaders,
        signal: AbortSignal.timeout(10_000),
      });
      const bdGetMs = Math.round(performance.now() - bdGetStart);
      if (bdGetRes.ok) {
        const bdJson = await bdGetRes.json();
        const postStart = performance.now();
        const postRes = await fetch(`${BASE}/api/business-date`, {
          method: 'POST',
          headers: adminHeaders,
          body: JSON.stringify({ businessDate: bdJson.businessDate, user: 'Checklist Admin' }),
          signal: AbortSignal.timeout(10_000),
        });
        const postMs = Math.round(performance.now() - postStart);
        if (postRes.ok) pass(`admin program tarihi POST (${postMs} ms, GET ${bdGetMs} ms)`);
        else note(`admin program tarihi POST → ${postRes.status}`);
      } else {
        note(`admin program tarihi GET → ${bdGetRes.status}`);
      }

      const profileStart = performance.now();
      const profileGetRes = await fetch(`${BASE}/api/property-profile`, {
        headers: adminHeaders,
        signal: AbortSignal.timeout(10_000),
      });
      const profileGetMs = Math.round(performance.now() - profileStart);
      if (profileGetRes.ok) {
        const profileJson = await profileGetRes.json();
        const postStart = performance.now();
        const postRes = await fetch(`${BASE}/api/property-profile`, {
          method: 'POST',
          headers: adminHeaders,
          body: JSON.stringify({ ...profileJson.profile, user: 'Checklist Admin' }),
          signal: AbortSignal.timeout(10_000),
        });
        const postMs = Math.round(performance.now() - postStart);
        if (postRes.ok) pass(`admin otel profili POST (${postMs} ms, GET ${profileGetMs} ms)`);
        else note(`admin otel profili POST → ${postRes.status}`);
      } else {
        note(`admin otel profili GET → ${profileGetRes.status}`);
      }
    } else if (authRequired) {
      note('admin checklist login yok — kullanıcı POST atlandı');
    }
  } catch (err) {
    note(`kullanıcı güncelleme — ${err instanceof Error ? err.message : String(err)}`);
  }

  try {
    const viewerHeaders = await obtainViewerChecklistAuth();
    if (viewerHeaders.Authorization) {
      const usersListStart = performance.now();
      const usersListRes = await fetch(`${BASE}/api/users`, {
        headers: viewerHeaders,
        signal: AbortSignal.timeout(10_000),
      });
      const usersListMs = Math.round(performance.now() - usersListStart);
      if (usersListRes.ok) pass(`viewer kullanıcı listesi (${usersListMs} ms)`);
      else note(`viewer kullanıcı listesi → ${usersListRes.status}`);

      const groupsListStart = performance.now();
      const groupsListRes = await fetch(`${BASE}/api/user-groups`, {
        headers: viewerHeaders,
        signal: AbortSignal.timeout(10_000),
      });
      const groupsListMs = Math.round(performance.now() - groupsListStart);
      if (groupsListRes.ok) pass(`viewer kullanıcı grupları (${groupsListMs} ms)`);
      else note(`viewer kullanıcı grupları → ${groupsListRes.status}`);

      const bdStart = performance.now();
      const bdRes = await fetch(`${BASE}/api/business-date`, {
        headers: viewerHeaders,
        signal: AbortSignal.timeout(10_000),
      });
      const bdMs = Math.round(performance.now() - bdStart);
      if (bdRes.ok) pass(`viewer program tarihi GET (${bdMs} ms)`);
      else note(`viewer program tarihi GET → ${bdRes.status}`);

      const upStart = performance.now();
      const upRes = await fetch(`${BASE}/api/user-params`, {
        headers: viewerHeaders,
        signal: AbortSignal.timeout(10_000),
      });
      const upMs = Math.round(performance.now() - upStart);
      if (upRes.ok) pass(`viewer kullanıcı parametreleri (${upMs} ms)`);
      else note(`viewer kullanıcı parametreleri → ${upRes.status}`);

      const cpStart = performance.now();
      const cpRes = await fetch(`${BASE}/api/config-params`, {
        headers: viewerHeaders,
        signal: AbortSignal.timeout(10_000),
      });
      const cpMs = Math.round(performance.now() - cpStart);
      if (cpRes.ok) pass(`viewer konfig parametreleri (${cpMs} ms)`);
      else note(`viewer konfig parametreleri → ${cpRes.status}`);

      const mrStart = performance.now();
      const mrRes = await fetch(`${BASE}/api/market-required`, {
        headers: viewerHeaders,
        signal: AbortSignal.timeout(10_000),
      });
      const mrMs = Math.round(performance.now() - mrStart);
      if (mrRes.ok) pass(`viewer market zorunlu GET (${mrMs} ms)`);
      else note(`viewer market zorunlu GET → ${mrRes.status}`);

      const opsStart = performance.now();
      const opsRes = await fetch(`${BASE}/api/operations/summary`, {
        headers: viewerHeaders,
        signal: AbortSignal.timeout(10_000),
      });
      const opsMs = Math.round(performance.now() - opsStart);
      if (opsRes.ok) pass(`viewer operasyon özeti (${opsMs} ms)`);
      else note(`viewer operasyon özeti → ${opsRes.status}`);

      const rbStart = performance.now();
      const rbRes = await fetch(`${BASE}/api/room-blocks`, {
        headers: viewerHeaders,
        signal: AbortSignal.timeout(10_000),
      });
      const rbMs = Math.round(performance.now() - rbStart);
      if (rbRes.ok) pass(`viewer oda blokajı GET (${rbMs} ms)`);
      else note(`viewer oda blokajı GET → ${rbRes.status}`);

      const grStart = performance.now();
      const grRes = await fetch(`${BASE}/api/gr-inhouse`, {
        headers: viewerHeaders,
        signal: AbortSignal.timeout(10_000),
      });
      const grMs = Math.round(performance.now() - grStart);
      if (grRes.ok) pass(`viewer in-house listesi (${grMs} ms)`);
      else note(`viewer gr-inhouse → ${grRes.status}`);

      const resListStart = performance.now();
      const resListRes = await fetch(`${BASE}/api/reservations`, {
        headers: viewerHeaders,
        signal: AbortSignal.timeout(15_000),
      });
      const resListMs = Math.round(performance.now() - resListStart);
      if (resListRes.ok) {
        const { reservations } = await resListRes.json();
        const inHouse = reservations?.find((r) => r.status === 'CHECKED_IN') ?? reservations?.[0];
        if (inHouse?.id) {
          const folioStart = performance.now();
          const folioRes = await fetch(`${BASE}/api/folio?reservationId=${encodeURIComponent(inHouse.id)}`, {
            headers: viewerHeaders,
            signal: AbortSignal.timeout(10_000),
          });
          const folioMs = Math.round(performance.now() - folioStart);
          if (folioRes.ok) pass(`viewer folyo GET (${folioMs} ms)`);
          else note(`viewer folyo GET → ${folioRes.status}`);
        } else {
          note(`viewer folyo — rezervasyon yok (liste ${resListMs} ms)`);
        }
      } else {
        note(`viewer folyo — rezervasyon listesi → ${resListRes.status}`);
      }

      const stockStart = performance.now();
      const stockRes = await fetch(`${BASE}/api/inventory/stock`, {
        headers: viewerHeaders,
        signal: AbortSignal.timeout(10_000),
      });
      const stockMs = Math.round(performance.now() - stockStart);
      if (stockRes.ok) pass(`viewer stok listesi (${stockMs} ms)`);
      else note(`viewer stok listesi → ${stockRes.status}`);

      const ledgerStart = performance.now();
      const ledgerRes = await fetch(`${BASE}/api/cash?view=ledger`, {
        headers: viewerHeaders,
        signal: AbortSignal.timeout(10_000),
      });
      const ledgerMs = Math.round(performance.now() - ledgerStart);
      if (ledgerRes.ok) pass(`viewer kasa defteri (${ledgerMs} ms)`);
      else note(`viewer kasa defteri → ${ledgerRes.status}`);

      const dashStart = performance.now();
      const dashRes = await fetch(`${BASE}/api/dashboard`, {
        headers: viewerHeaders,
        signal: AbortSignal.timeout(15_000),
      });
      const dashMs = Math.round(performance.now() - dashStart);
      if (dashRes.ok) pass(`viewer dashboard (${dashMs} ms)`);
      else note(`viewer dashboard → ${dashRes.status}`);

      const rackStart = performance.now();
      const rackRes = await fetch(`${BASE}/api/rack`, {
        headers: viewerHeaders,
        signal: AbortSignal.timeout(15_000),
      });
      const rackMs = Math.round(performance.now() - rackStart);
      if (rackRes.ok) pass(`viewer rack (${rackMs} ms)`);
      else note(`viewer rack → ${rackRes.status}`);

      const closeStart = performance.now();
      const closeRes = await fetch(`${BASE}/api/cash?view=close-report`, {
        headers: viewerHeaders,
        signal: AbortSignal.timeout(20_000),
      });
      const closeMs = Math.round(performance.now() - closeStart);
      if (closeRes.ok) pass(`viewer kasa kapanış raporu (${closeMs} ms)`);
      else note(`viewer kasa kapanış → ${closeRes.status}`);

      let viewerUserDenyBody;
      if (usersListRes.ok) {
        const usersJson = await usersListRes.json();
        const target = usersJson.users?.[0];
        if (target?.id) {
          viewerUserDenyBody = { id: target.id, department: target.department ?? 'Deny' };
        }
      }

      const writeChecks = [
        {
          label: 'viewer rezervasyon POST',
          path: '/api/reservations',
          body: {
            id: `chk-viewer-${Date.now()}`,
            refNo: 'CHK-VIEWER',
            guestName: 'Viewer Deny',
            checkIn: '2026-08-01',
            checkOut: '2026-08-03',
            roomType: 'DBL',
            adults: 1,
            children: 0,
            mealPlan: 'BB',
            rate: 1000,
            currency: 'TRY',
            agency: 'Direct',
            market: 'BAR',
            status: 'CONFIRMED',
            createdAt: new Date().toISOString().slice(0, 10),
          },
        },
        {
          label: 'viewer kullanıcı grubu POST',
          path: '/api/user-groups',
          body: { code: 'CHK-DENY', name: 'Checklist Deny Group' },
        },
        ...(viewerUserDenyBody
          ? [{
              label: 'viewer kullanıcı POST',
              path: '/api/users',
              body: viewerUserDenyBody,
            }]
          : []),
        {
          label: 'viewer HK oda listesi GET',
          path: '/api/housekeeping/rooms',
          method: 'GET',
        },
        {
          label: 'viewer HK routing GET',
          path: '/api/hk/routes',
          method: 'GET',
        },
        {
          label: 'viewer HK routing POST',
          path: '/api/hk/routes',
          body: { code: 'CHK-DENY', name: 'Checklist Deny', floors: [1] },
        },
        {
          label: 'viewer room-suggest GET',
          path: '/api/reception/room-suggest?reservationId=chk-viewer-deny',
          method: 'GET',
        },
        {
          label: 'viewer check-in POST',
          path: '/api/reception/check-in',
          body: {
            reservationId: 'chk-viewer-deny',
            roomNo: '101',
            guestName: 'Viewer',
            checkIn: '2026-09-01',
            checkOut: '2026-09-03',
            reservationRef: 'CHK-VIEWER',
          },
        },
        {
          label: 'viewer check-out POST',
          path: '/api/reception/checkout',
          body: { roomNo: '101', guestName: 'Viewer Deny' },
        },
        {
          label: 'viewer program tarihi POST',
          path: '/api/business-date',
          body: { businessDate: '2026-12-01', user: 'Viewer Deny' },
        },
        {
          label: 'viewer kullanıcı parametresi POST',
          path: '/api/user-params',
          body: { key: 'CHK_DENY', value: '1' },
        },
        {
          label: 'viewer konfig parametresi POST',
          path: '/api/config-params',
          body: { key: 'CHK_DENY', value: '1' },
        },
        {
          label: 'viewer market zorunluluğu POST',
          path: '/api/market-required',
          body: { required: true },
        },
        {
          label: 'viewer depozit POST',
          path: '/api/deposits',
          body: { guestName: 'Viewer Deny', amount: 100, method: 'cash' },
        },
        {
          label: 'viewer folyo POST',
          path: '/api/folio',
          body: {
            reservationId: 'chk-viewer-deny',
            amount: 10,
            register: 'CHK-VIEWER',
          },
        },
      ];
      for (const check of writeChecks) {
        const postStart = performance.now();
        const res = await fetch(`${BASE}${check.path}`, {
          method: check.method ?? 'POST',
          headers: viewerHeaders,
          body: check.body ? JSON.stringify(check.body) : undefined,
          signal: AbortSignal.timeout(10_000),
        });
        const postMs = Math.round(performance.now() - postStart);
        if (res.status === 403) pass(`${check.label} → 403 (${postMs} ms)`);
        else note(`${check.label} → ${res.status}`);
      }
    } else if (authRequired) {
      note('viewer checklist login yok — salt okunur yazma reddi atlandı');
    }
  } catch (err) {
    note(`viewer yazma reddi — ${err instanceof Error ? err.message : String(err)}`);
  }

  try {
    const hkHeaders = await obtainHkChecklistAuth();
    if (hkHeaders.Authorization) {
      const listStart = performance.now();
      const listRes = await fetch(`${BASE}/api/reservations`, {
        headers: hkHeaders,
        signal: AbortSignal.timeout(10_000),
      });
      const listMs = Math.round(performance.now() - listStart);
      if (listRes.ok) pass(`HK rezervasyon listesi (${listMs} ms)`);
      else note(`HK rezervasyon listesi → ${listRes.status}`);

      const boardStart = performance.now();
      const boardRes = await fetch(`${BASE}/api/housekeeping/rooms`, {
        headers: hkHeaders,
        signal: AbortSignal.timeout(10_000),
      });
      const boardMs = Math.round(performance.now() - boardStart);
      if (boardRes.ok) {
        const board = await boardRes.json();
        const roomNo = board.rooms?.[0]?.roomNo;
        if (roomNo) {
          const patchStart = performance.now();
          const patchRes = await fetch(`${BASE}/api/housekeeping/rooms`, {
            method: 'PATCH',
            headers: hkHeaders,
            body: JSON.stringify({ roomNo, notes: `checklist ${Date.now()}` }),
            signal: AbortSignal.timeout(10_000),
          });
          const patchMs = Math.round(performance.now() - patchStart);
          if (patchRes.ok) pass(`HK oda PATCH (${patchMs} ms, oda ${roomNo})`);
          else note(`HK oda PATCH → ${patchRes.status}`);
        } else {
          note(`HK oda PATCH — oda yok (board ${boardMs} ms)`);
        }
      } else {
        note(`HK oda listesi → ${boardRes.status}`);
      }

      const routesStart = performance.now();
      const routesRes = await fetch(`${BASE}/api/hk/routes`, {
        headers: hkHeaders,
        signal: AbortSignal.timeout(10_000),
      });
      const routesMs = Math.round(performance.now() - routesStart);
      if (routesRes.ok) pass(`HK routing API (${routesMs} ms)`);
      else note(`HK routing API → ${routesRes.status}`);

      const routePostStart = performance.now();
      const routePostRes = await fetch(`${BASE}/api/hk/routes`, {
        method: 'POST',
        headers: hkHeaders,
        body: JSON.stringify({
          code: `H${String(Date.now()).slice(-4)}`,
          name: 'Checklist HK Route',
          floors: [1],
        }),
        signal: AbortSignal.timeout(10_000),
      });
      const routePostMs = Math.round(performance.now() - routePostStart);
      if (routePostRes.ok) pass(`HK routing POST (${routePostMs} ms)`);
      else note(`HK routing POST → ${routePostRes.status}`);

      const syncStart = performance.now();
      const syncRes = await fetch(
        `${BASE}/api/sync/pull?deviceId=checklist-hk&since=1970-01-01T00:00:00.000Z`,
        { headers: hkHeaders, signal: AbortSignal.timeout(10_000) },
      );
      const syncMs = Math.round(performance.now() - syncStart);
      if (syncRes.ok) pass(`HK sync pull (${syncMs} ms)`);
      else note(`HK sync pull → ${syncRes.status}`);

      const denyStart = performance.now();
      const denyRes = await fetch(`${BASE}/api/reservations`, {
        method: 'POST',
        headers: hkHeaders,
        body: JSON.stringify({
          id: `chk-hk-deny-${Date.now()}`,
          refNo: 'CHK-HK',
          guestName: 'HK Deny',
          checkIn: '2026-09-01',
          checkOut: '2026-09-03',
          roomType: 'DBL',
          adults: 1,
          children: 0,
          mealPlan: 'BB',
          rate: 1000,
          currency: 'TRY',
          agency: 'Direct',
          market: 'BAR',
          status: 'CONFIRMED',
          createdAt: new Date().toISOString().slice(0, 10),
        }),
        signal: AbortSignal.timeout(10_000),
      });
      const denyMs = Math.round(performance.now() - denyStart);
      if (denyRes.status === 403) pass(`HK rezervasyon POST → 403 (${denyMs} ms)`);
      else note(`HK rezervasyon POST → ${denyRes.status}`);

      const cashDenyStart = performance.now();
      const cashDenyRes = await fetch(`${BASE}/api/cash?view=ledger`, {
        headers: hkHeaders,
        signal: AbortSignal.timeout(10_000),
      });
      const cashDenyMs = Math.round(performance.now() - cashDenyStart);
      if (cashDenyRes.status === 403) pass(`HK kasa defteri GET → 403 (${cashDenyMs} ms)`);
      else note(`HK kasa defteri GET → ${cashDenyRes.status}`);

      const depDenyStart = performance.now();
      const depDenyRes = await fetch(`${BASE}/api/deposits`, {
        headers: hkHeaders,
        signal: AbortSignal.timeout(10_000),
      });
      const depDenyMs = Math.round(performance.now() - depDenyStart);
      if (depDenyRes.status === 403) pass(`HK depozit GET → 403 (${depDenyMs} ms)`);
      else note(`HK depozit GET → ${depDenyRes.status}`);

      const depPostDenyStart = performance.now();
      const depPostDenyRes = await fetch(`${BASE}/api/deposits`, {
        method: 'POST',
        headers: hkHeaders,
        body: JSON.stringify({ guestName: 'HK Deny', amount: 50, method: 'cash' }),
        signal: AbortSignal.timeout(10_000),
      });
      const depPostDenyMs = Math.round(performance.now() - depPostDenyStart);
      if (depPostDenyRes.status === 403) pass(`HK depozit POST → 403 (${depPostDenyMs} ms)`);
      else note(`HK depozit POST → ${depPostDenyRes.status}`);

      if (listRes.ok) {
        const { reservations } = await listRes.json();
        const guest = reservations?.[0];
        if (guest?.id) {
          const folioDenyStart = performance.now();
          const folioDenyRes = await fetch(
            `${BASE}/api/folio?reservationId=${encodeURIComponent(guest.id)}`,
            { headers: hkHeaders, signal: AbortSignal.timeout(10_000) },
          );
          const folioDenyMs = Math.round(performance.now() - folioDenyStart);
          if (folioDenyRes.status === 403) pass(`HK folyo GET → 403 (${folioDenyMs} ms)`);
          else note(`HK folyo GET → ${folioDenyRes.status}`);
        }
      }
    } else if (authRequired) {
      note('HK checklist login yok — HK smoke atlandı');
    }
  } catch (err) {
    note(`HK smoke — ${err instanceof Error ? err.message : String(err)}`);
  }

  try {
    const accHeaders = await obtainAccountingChecklistAuth();
    if (accHeaders.Authorization) {
      const ledgerStart = performance.now();
      const ledgerRes = await fetch(`${BASE}/api/accounting/ledger`, {
        headers: accHeaders,
        signal: AbortSignal.timeout(10_000),
      });
      const ledgerMs = Math.round(performance.now() - ledgerStart);
      if (ledgerRes.ok) pass(`muhasebe defteri GET (${ledgerMs} ms)`);
      else note(`muhasebe defteri GET → ${ledgerRes.status}`);

      const postStart = performance.now();
      const postRes = await fetch(`${BASE}/api/accounting/ledger`, {
        method: 'POST',
        headers: accHeaders,
        body: JSON.stringify({
          account: 'CHK',
          description: `Checklist ${Date.now()}`,
          debit: 1,
          credit: 0,
        }),
        signal: AbortSignal.timeout(10_000),
      });
      const postMs = Math.round(performance.now() - postStart);
      if (postRes.ok) pass(`muhasebe defteri POST (${postMs} ms)`);
      else note(`muhasebe defteri POST → ${postRes.status}`);

      const auditStart = performance.now();
      const auditRes = await fetch(`${BASE}/api/audit`, {
        headers: accHeaders,
        signal: AbortSignal.timeout(10_000),
      });
      const auditMs = Math.round(performance.now() - auditStart);
      if (auditRes.ok) pass(`muhasebe gece denetim GET (${auditMs} ms)`);
      else note(`muhasebe gece denetim GET → ${auditRes.status}`);

      const denyStart = performance.now();
      const denyRes = await fetch(`${BASE}/api/reservations`, {
        method: 'POST',
        headers: accHeaders,
        body: JSON.stringify({
          id: `chk-acc-deny-${Date.now()}`,
          refNo: 'CHK-ACC',
          guestName: 'Accounting Deny',
          checkIn: '2026-09-10',
          checkOut: '2026-09-12',
          roomType: 'DBL',
          adults: 1,
          children: 0,
          mealPlan: 'BB',
          rate: 1000,
          currency: 'TRY',
          agency: 'Direct',
          market: 'BAR',
          status: 'CONFIRMED',
          createdAt: new Date().toISOString().slice(0, 10),
        }),
        signal: AbortSignal.timeout(10_000),
      });
      const denyMs = Math.round(performance.now() - denyStart);
      if (denyRes.status === 403) pass(`muhasebe rezervasyon POST → 403 (${denyMs} ms)`);
      else note(`muhasebe rezervasyon POST → ${denyRes.status}`);

      const suggestDenyStart = performance.now();
      const suggestDenyRes = await fetch(`${BASE}/api/reception/room-suggest?reservationId=chk-acc-deny`, {
        headers: accHeaders,
        signal: AbortSignal.timeout(10_000),
      });
      const suggestDenyMs = Math.round(performance.now() - suggestDenyStart);
      if (suggestDenyRes.status === 403) pass(`muhasebe room-suggest GET → 403 (${suggestDenyMs} ms)`);
      else note(`muhasebe room-suggest GET → ${suggestDenyRes.status}`);

      const checkoutDenyStart = performance.now();
      const checkoutDenyRes = await fetch(`${BASE}/api/reception/checkout`, {
        method: 'POST',
        headers: accHeaders,
        body: JSON.stringify({ roomNo: '101', guestName: 'Accounting Deny' }),
        signal: AbortSignal.timeout(10_000),
      });
      const checkoutDenyMs = Math.round(performance.now() - checkoutDenyStart);
      if (checkoutDenyRes.status === 403) pass(`muhasebe check-out POST → 403 (${checkoutDenyMs} ms)`);
      else note(`muhasebe check-out POST → ${checkoutDenyRes.status}`);

      const cashStart = performance.now();
      const cashRes = await fetch(`${BASE}/api/cash?view=ledger`, {
        headers: accHeaders,
        signal: AbortSignal.timeout(10_000),
      });
      const cashMs = Math.round(performance.now() - cashStart);
      if (cashRes.ok) pass(`muhasebe kasa defteri GET (${cashMs} ms)`);
      else note(`muhasebe kasa defteri GET → ${cashRes.status}`);
    } else if (authRequired) {
      note('muhasebe checklist login yok — muhasebe smoke atlandı');
    }
  } catch (err) {
    note(`muhasebe smoke — ${err instanceof Error ? err.message : String(err)}`);
  }

  try {
    const recHeaders = await obtainReceptionChecklistAuth();
    if (recHeaders.Authorization) {
      const listStart = performance.now();
      const listRes = await fetch(`${BASE}/api/reservations`, {
        headers: recHeaders,
        signal: AbortSignal.timeout(10_000),
      });
      const listMs = Math.round(performance.now() - listStart);
      if (listRes.ok) pass(`resepsiyon rezervasyon listesi (${listMs} ms)`);
      else note(`resepsiyon rezervasyon listesi → ${listRes.status}`);

      const postStart = performance.now();
      const postRes = await fetch(`${BASE}/api/reservations`, {
        method: 'POST',
        headers: recHeaders,
        body: JSON.stringify({
          id: `chk-rec-${Date.now()}`,
          refNo: `CHK-REC-${Date.now()}`,
          guestName: 'Checklist Reception',
          checkIn: '2026-09-20',
          checkOut: '2026-09-22',
          roomType: 'DBL',
          adults: 2,
          children: 0,
          mealPlan: 'BB',
          rate: 4000,
          currency: 'TRY',
          agency: 'Direct',
          market: 'BAR',
          status: 'CONFIRMED',
          createdAt: new Date().toISOString().slice(0, 10),
        }),
        signal: AbortSignal.timeout(10_000),
      });
      const postMs = Math.round(performance.now() - postStart);
      if (postRes.ok) pass(`resepsiyon rezervasyon POST (${postMs} ms)`);
      else note(`resepsiyon rezervasyon POST → ${postRes.status}`);

      const listJson = listRes.ok ? await listRes.json() : null;
      const arrival = listJson?.reservations?.find((r) => r.status === 'CONFIRMED') ?? listJson?.reservations?.[0];
      if (arrival?.id) {
        const ciStart = performance.now();
        const ciRes = await fetch(`${BASE}/api/reception/check-in`, {
          method: 'POST',
          headers: recHeaders,
          body: JSON.stringify({
            reservationId: arrival.id,
            roomNo: '101',
            guestName: arrival.guestName,
            checkIn: arrival.checkIn,
            checkOut: arrival.checkOut,
            reservationRef: arrival.refNo,
            hotspot: false,
            tesa: false,
            pbx: false,
          }),
          signal: AbortSignal.timeout(15_000),
        });
        const ciMs = Math.round(performance.now() - ciStart);
        if (ciRes.status !== 403) pass(`resepsiyon check-in (${ciMs} ms, status ${ciRes.status})`);
        else note(`resepsiyon check-in → 403`);
      } else {
        note('resepsiyon check-in — uygun rezervasyon yok');
      }

      if (arrival?.id) {
        const suggestStart = performance.now();
        const suggestRes = await fetch(
          `${BASE}/api/reception/room-suggest?reservationId=${encodeURIComponent(arrival.id)}`,
          { headers: recHeaders, signal: AbortSignal.timeout(15_000) },
        );
        const suggestMs = Math.round(performance.now() - suggestStart);
        if (suggestRes.ok) pass(`resepsiyon oda öneri (${suggestMs} ms)`);
        else note(`resepsiyon oda öneri → ${suggestRes.status}`);
      }

      const hkDenyStart = performance.now();
      const hkDenyRes = await fetch(`${BASE}/api/hk/routes`, {
        method: 'POST',
        headers: recHeaders,
        body: JSON.stringify({ code: 'CHK-REC-DENY', name: 'Reception Deny', floors: [1] }),
        signal: AbortSignal.timeout(10_000),
      });
      const hkDenyMs = Math.round(performance.now() - hkDenyStart);
      if (hkDenyRes.status === 403) pass(`resepsiyon HK routing POST → 403 (${hkDenyMs} ms)`);
      else note(`resepsiyon HK routing POST → ${hkDenyRes.status}`);

      const inHouse = listJson?.reservations?.find((r) => r.status === 'CHECKED_IN' && r.roomNo);
      if (inHouse?.roomNo) {
        const coStart = performance.now();
        const coRes = await fetch(`${BASE}/api/reception/checkout`, {
          method: 'POST',
          headers: recHeaders,
          body: JSON.stringify({
            roomNo: inHouse.roomNo,
            guestName: inHouse.guestName,
            reservationId: inHouse.id,
          }),
          signal: AbortSignal.timeout(15_000),
        });
        const coMs = Math.round(performance.now() - coStart);
        if (coRes.status !== 403) pass(`resepsiyon check-out (${coMs} ms, status ${coRes.status})`);
        else note(`resepsiyon check-out → 403`);
      } else {
        note('resepsiyon check-out — konaklayan misafir yok');
      }

      const banketStart = performance.now();
      const banketRes = await fetch(`${BASE}/api/fnb/banket`, {
        method: 'POST',
        headers: recHeaders,
        body: JSON.stringify({
          eventName: `Checklist Banket ${Date.now()}`,
          hall: 'Ana Salon',
          contact: 'reception@hotelsapphire.com',
          pax: 30,
          status: 'option',
        }),
        signal: AbortSignal.timeout(10_000),
      });
      const banketMs = Math.round(performance.now() - banketStart);
      if (banketRes.ok) pass(`resepsiyon banket POST (${banketMs} ms)`);
      else note(`resepsiyon banket POST → ${banketRes.status}`);

      const dashStart = performance.now();
      const dashRes = await fetch(`${BASE}/api/dashboard`, {
        headers: recHeaders,
        signal: AbortSignal.timeout(15_000),
      });
      const dashMs = Math.round(performance.now() - dashStart);
      if (dashRes.ok) pass(`resepsiyon dashboard (${dashMs} ms)`);
      else note(`resepsiyon dashboard → ${dashRes.status}`);

      const rackStart = performance.now();
      const rackRes = await fetch(`${BASE}/api/rack`, {
        headers: recHeaders,
        signal: AbortSignal.timeout(15_000),
      });
      const rackMs = Math.round(performance.now() - rackStart);
      if (rackRes.ok) pass(`resepsiyon rack (${rackMs} ms)`);
      else note(`resepsiyon rack → ${rackRes.status}`);

      const closeStart = performance.now();
      const closeRes = await fetch(`${BASE}/api/cash?view=close-report`, {
        headers: recHeaders,
        signal: AbortSignal.timeout(20_000),
      });
      const closeMs = Math.round(performance.now() - closeStart);
      if (closeRes.ok) pass(`resepsiyon kasa kapanış raporu (${closeMs} ms)`);
      else note(`resepsiyon kasa kapanış → ${closeRes.status}`);

      const folioGuest =
        listJson?.reservations?.find((r) => r.status === 'CHECKED_IN') ?? listJson?.reservations?.[0];
      if (folioGuest?.id) {
        const folioStart = performance.now();
        const folioRes = await fetch(
          `${BASE}/api/folio?reservationId=${encodeURIComponent(folioGuest.id)}`,
          { headers: recHeaders, signal: AbortSignal.timeout(10_000) },
        );
        const folioMs = Math.round(performance.now() - folioStart);
        if (folioRes.ok) pass(`resepsiyon folyo GET (${folioMs} ms)`);
        else note(`resepsiyon folyo GET → ${folioRes.status}`);

        const folioPostStart = performance.now();
        const folioPostRes = await fetch(`${BASE}/api/folio`, {
          method: 'POST',
          headers: recHeaders,
          body: JSON.stringify({
            reservationId: folioGuest.id,
            amount: 10,
            register: 'CHK-REC',
            description: 'Checklist tahsilat',
          }),
          signal: AbortSignal.timeout(10_000),
        });
        const folioPostMs = Math.round(performance.now() - folioPostStart);
        if (folioPostRes.ok) pass(`resepsiyon folyo POST (${folioPostMs} ms)`);
        else note(`resepsiyon folyo POST → ${folioPostRes.status}`);
      }

      const depStart = performance.now();
      const depRes = await fetch(`${BASE}/api/deposits`, {
        headers: recHeaders,
        signal: AbortSignal.timeout(10_000),
      });
      const depMs = Math.round(performance.now() - depStart);
      if (depRes.ok) pass(`resepsiyon depozit listesi (${depMs} ms)`);
      else note(`resepsiyon depozit listesi → ${depRes.status}`);

      const depPostStart = performance.now();
      const depPostRes = await fetch(`${BASE}/api/deposits`, {
        method: 'POST',
        headers: recHeaders,
        body: JSON.stringify({
          guestName: 'Checklist Reception Deposit',
          amount: 200,
          method: 'cash',
          notes: 'checklist smoke',
        }),
        signal: AbortSignal.timeout(10_000),
      });
      const depPostMs = Math.round(performance.now() - depPostStart);
      if (depPostRes.ok) pass(`resepsiyon depozit POST (${depPostMs} ms)`);
      else note(`resepsiyon depozit POST → ${depPostRes.status}`);
    } else if (authRequired) {
      note('resepsiyon checklist login yok — resepsiyon smoke atlandı');
    }
  } catch (err) {
    note(`resepsiyon smoke — ${err instanceof Error ? err.message : String(err)}`);
  }

  try {
    const { res, ms } = await timed('/api/cash?view=close-report', 20_000);
    if (res.ok) pass(`kasa kapanış raporu JSON (${ms} ms)`);
    else note(`kasa kapanış JSON → ${res.status}`);
  } catch (err) {
    note(`kasa kapanış — ${err instanceof Error ? err.message : String(err)}`);
  }

  try {
    const start = performance.now();
    const res = await authFetch('/api/cash?view=close-report&format=pdf', {
      signal: AbortSignal.timeout(30_000),
    });
    const ms = Math.round(performance.now() - start);
    const ct = res.headers.get('content-type') ?? '';
    if (res.ok && ct.includes('pdf')) pass(`kasa kapanış PDF (${ms} ms)`);
    else note(`kasa kapanış PDF → ${res.status}`);
  } catch (err) {
    note(`kasa PDF — ${err instanceof Error ? err.message : String(err)}`);
  }

  try {
    const { res: resList, ms: listMs } = await timed('/api/reservations', 20_000);
    if (!resList.ok) {
      note(`rezervasyon listesi → ${resList.status} (${listMs} ms)`);
    } else {
      const { reservations } = await resList.json();
      pass(`rezervasyon listesi (${listMs} ms, ${reservations?.length ?? 0} kayıt)`);
      const inHouse = reservations?.find((r) => r.status === 'CHECKED_IN');
      if (inHouse) {
        const { res: folio, ms: folioMs } = await timed(`/api/folio?reservationId=${inHouse.id}`, 10_000);
        if (folio.ok) pass(`folyo API (konaklayan, ${folioMs} ms)`);
        else note(`folyo API → ${folio.status}`);
      } else {
        note('folyo API — CHECKED_IN rezervasyon yok');
      }
    }
  } catch (err) {
    note(`folyo API — ${err instanceof Error ? err.message : String(err)}`);
  }

  try {
    const { res, ms } = await timed('/api/audit', 10_000);
    if (res.ok) pass(`gece denetim API (${ms} ms)`);
    else note(`audit API → ${res.status}`);
  } catch (err) {
    note(`audit API — ${err instanceof Error ? err.message : String(err)}`);
  }

  try {
    const { res, ms } = await timed('/api/rate-plans', 10_000);
    if (res.ok) {
      const j = await res.json();
      pass(`rate plan API (${ms} ms, ${j.plans?.length ?? 0} plan)`);
    } else note(`rate-plans API → ${res.status}`);
  } catch (err) {
    note(`rate-plans API — ${err instanceof Error ? err.message : String(err)}`);
  }

  try {
    const { res, ms } = await timed('/api/reservations/groups', 10_000);
    if (res.ok) {
      const j = await res.json();
      pass(`grup rezervasyon API (${ms} ms, ${j.groups?.length ?? 0} grup)`);
      const first = j.groups?.[0];
      if (first?.id) {
        const { res: detail, ms: detailMs } = await timed(
          `/api/reservations/groups?groupId=${encodeURIComponent(first.id)}&view=allotment`,
          10_000,
        );
        if (detail.ok) pass(`grup allotment API (${detailMs} ms)`);
        else note(`grup allotment → ${detail.status}`);
      }
    } else if (res.status === 403) {
      note(`grup rezervasyon API → ${res.status} (reservations.read)`);
    } else {
      note(`groups API → ${res.status}`);
    }
  } catch (err) {
    note(`groups API — ${err instanceof Error ? err.message : String(err)}`);
  }

  try {
    const { res, ms } = await timed('/api/reservations/groups?view=pickup-report', 15_000);
    if (res.ok) {
      const j = await res.json();
      const totals = j.report?.totals;
      pass(
        `grup pickup raporu (${ms} ms, ${totals?.groups ?? 0} grup, %${totals?.pickupPct ?? '?'})`,
      );
    } else {
      note(`grup pickup raporu → ${res.status}`);
    }
  } catch (err) {
    note(`grup pickup raporu — ${err instanceof Error ? err.message : String(err)}`);
  }

  try {
    const { res, ms } = await timed('/api/rate-plans?view=calendar&from=2026-06-01&to=2026-06-14', 10_000);
    if (res.ok) pass(`rate takvim API (${ms} ms)`);
    else note(`rate calendar API → ${res.status}`);
  } catch (err) {
    note(`rate calendar — ${err instanceof Error ? err.message : String(err)}`);
  }

  try {
    const { res, ms } = await timed('/api/reservations/availability?from=2026-06-01&days=7', 15_000);
    if (res.ok) {
      const j = await res.json();
      pass(`doluluk matrisi API (${ms} ms, ${j.matrix?.length ?? 0} gün, ${j.matchedReservations ?? '?'} rez.)`);
    } else if (res.status === 403) {
      fail('/api/reservations/availability', 'reservations.read izni gerekli');
    } else {
      note(`doluluk matrisi → ${res.status}`);
    }
  } catch (err) {
    note(`doluluk matrisi — ${err instanceof Error ? err.message : String(err)}`);
  }

  try {
    const start = performance.now();
    const res = await authFetch('/api/audit?format=pdf', { signal: AbortSignal.timeout(30_000) });
    const ms = Math.round(performance.now() - start);
    const ct = res.headers.get('content-type') ?? '';
    if (res.ok && ct.includes('pdf')) pass(`gece denetim PDF (${ms} ms)`);
    else note(`audit PDF → ${res.status}`);
  } catch (err) {
    note(`audit PDF — ${err instanceof Error ? err.message : String(err)}`);
  }

  try {
    const { res, ms } = await timed('/api/eod/pre-close', 15_000);
    if (res.ok) {
      const j = await res.json();
      pass(`gece denetim ön kontrol (${ms} ms, ready=${j.ready})`);
    } else note(`pre-close API → ${res.status}`);
  } catch (err) {
    note(`pre-close — ${err instanceof Error ? err.message : String(err)}`);
  }

  try {
    const { res, ms } = await timed('/api/companies', 10_000);
    if (res.ok) pass(`şirket master API (${ms} ms)`);
    else note(`companies API → ${res.status}`);
  } catch (err) {
    note(`companies — ${err instanceof Error ? err.message : String(err)}`);
  }

  try {
    const { res, ms } = await timed('/api/hk/routes', 10_000);
    if (res.ok) pass(`HK routing API (${ms} ms)`);
    else note(`hk routes → ${res.status}`);
  } catch (err) {
    note(`hk routes — ${err instanceof Error ? err.message : String(err)}`);
  }

  try {
    const { res, ms } = await timed('/api/agencies', 10_000);
    if (res.ok) {
      const j = await res.json();
      pass(`acenta kontrat API (${ms} ms, ${j.agencies?.length ?? 0} kontrat)`);
    } else note(`agencies API → ${res.status}`);
  } catch (err) {
    note(`agencies API — ${err instanceof Error ? err.message : String(err)}`);
  }

  try {
    const { res, ms } = await timed('/api/cash?view=ledger', 15_000);
    if (res.ok) pass(`kasa defteri JSON (${ms} ms)`);
    else note(`cash ledger JSON → ${res.status}`);
  } catch (err) {
    note(`cash ledger — ${err instanceof Error ? err.message : String(err)}`);
  }

  try {
    const start = performance.now();
    const res = await authFetch('/api/cash?view=ledger&format=pdf', {
      signal: AbortSignal.timeout(30_000),
    });
    const ms = Math.round(performance.now() - start);
    const ct = res.headers.get('content-type') ?? '';
    if (res.ok && ct.includes('pdf')) pass(`kasa defteri PDF (${ms} ms)`);
    else note(`cash ledger PDF → ${res.status}`);
  } catch (err) {
    note(`cash ledger PDF — ${err instanceof Error ? err.message : String(err)}`);
  }

  try {
    const { res: resList } = await timed('/api/reservations', 20_000);
    const { reservations } = await resList.json();
    const arrival = reservations?.find((r) => r.status === 'CONFIRMED' || r.status === 'TENTATIVE');
    if (arrival) {
      const { res, ms } = await timed(`/api/reception/room-suggest?reservationId=${arrival.id}`, 15_000);
      if (res.ok) pass(`check-in oda öneri API (${ms} ms)`);
      else note(`room-suggest → ${res.status}`);
    } else {
      note('room-suggest — uygun CONFIRMED rezervasyon yok');
    }
  } catch (err) {
    note(`room-suggest — ${err instanceof Error ? err.message : String(err)}`);
  }

  try {
    const start = performance.now();
    const res = await authFetch('/api/reception/checkout', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ roomNo: '999', guestName: 'Checklist FO Manager' }),
      signal: AbortSignal.timeout(15_000),
    });
    const ms = Math.round(performance.now() - start);
    if (res.status !== 403) pass(`fo_manager check-out (${ms} ms, status ${res.status})`);
    else note(`fo_manager check-out → 403`);
  } catch (err) {
    note(`fo_manager check-out — ${err instanceof Error ? err.message : String(err)}`);
  }

  try {
    const listStart = performance.now();
    const listRes = await authFetch('/api/reservations', { signal: AbortSignal.timeout(20_000) });
    const listMs = Math.round(performance.now() - listStart);
    if (!listRes.ok) {
      note(`fo_manager check-in — rezervasyon listesi → ${listRes.status}`);
    } else {
      const { reservations } = await listRes.json();
      const arrival = reservations?.find((r) => r.status === 'CONFIRMED' || r.status === 'TENTATIVE');
      if (arrival?.id) {
        const ciStart = performance.now();
        const ciRes = await authFetch('/api/reception/check-in', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            reservationId: arrival.id,
            roomNo: '103',
            guestName: arrival.guestName,
            checkIn: arrival.checkIn,
            checkOut: arrival.checkOut,
            reservationRef: arrival.refNo,
            hotspot: false,
            tesa: false,
            pbx: false,
          }),
          signal: AbortSignal.timeout(15_000),
        });
        const ciMs = Math.round(performance.now() - ciStart);
        if (ciRes.status !== 403) pass(`fo_manager check-in (${ciMs} ms, status ${ciRes.status})`);
        else note(`fo_manager check-in → 403`);
      } else {
        note(`fo_manager check-in — uygun rezervasyon yok (liste ${listMs} ms)`);
      }
    }
  } catch (err) {
    note(`fo_manager check-in — ${err instanceof Error ? err.message : String(err)}`);
  }

  try {
    const denyStart = performance.now();
    const denyRes = await authFetch('/api/business-date', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ businessDate: '2026-12-20', user: 'Checklist FO Deny' }),
      signal: AbortSignal.timeout(10_000),
    });
    const denyMs = Math.round(performance.now() - denyStart);
    if (denyRes.status === 403) pass(`fo_manager program tarihi POST → 403 (${denyMs} ms)`);
    else note(`fo_manager program tarihi POST → ${denyRes.status}`);
  } catch (err) {
    note(`fo_manager program tarihi POST — ${err instanceof Error ? err.message : String(err)}`);
  }

  try {
    const start = performance.now();
    const res = await authFetch('/api/agencies?all=1', { signal: AbortSignal.timeout(10_000) });
    const ms = Math.round(performance.now() - start);
    if (res.ok) {
      const j = await res.json();
      pass(`fo_manager acenta listesi (${ms} ms, ${j.agencies?.length ?? 0} kontrat)`);
    } else note(`fo_manager acenta listesi → ${res.status}`);
  } catch (err) {
    note(`fo_manager acenta listesi — ${err instanceof Error ? err.message : String(err)}`);
  }

  try {
    const start = performance.now();
    const res = await authFetch('/api/eod/night-audit-package?format=pdf', {
      signal: AbortSignal.timeout(30_000),
    });
    const ms = Math.round(performance.now() - start);
    const ct = res.headers.get('content-type') ?? '';
    if (res.ok && ct.includes('pdf')) pass(`gece denetim paketi PDF (${ms} ms)`);
    else note(`night-audit-package PDF → ${res.status}`);
  } catch (err) {
    note(`night-audit-package PDF — ${err instanceof Error ? err.message : String(err)}`);
  }

  try {
    const { res, ms } = await timed('/api/fx-exchanges', 10_000);
    if (res.ok) {
      const j = await res.json();
      pass(`döviz bozdurma API (${ms} ms, ${j.exchanges?.length ?? 0} kayıt)`);
    } else note(`fx-exchanges API → ${res.status}`);
  } catch (err) {
    note(`fx-exchanges — ${err instanceof Error ? err.message : String(err)}`);
  }

  try {
    const { res, ms } = await timed('/api/guest-traces', 10_000);
    if (res.ok) {
      const j = await res.json();
      pass(`misafir trace API (${ms} ms, ${j.traces?.length ?? 0} kayıt)`);
    } else note(`guest-traces API → ${res.status}`);
  } catch (err) {
    note(`guest-traces — ${err instanceof Error ? err.message : String(err)}`);
  }

  try {
    const { res, ms } = await timed('/api/inventory/stock', 10_000);
    if (res.ok) {
      const j = await res.json();
      pass(`stok API (${ms} ms, ${j.items?.length ?? 0} kalem)`);
    } else note(`inventory stock → ${res.status}`);
  } catch (err) {
    note(`inventory stock — ${err instanceof Error ? err.message : String(err)}`);
  }

  try {
    const { res, ms } = await timed('/api/guest-complaints', 10_000);
    if (res.ok) {
      const j = await res.json();
      pass(`şikayet API (${ms} ms, ${j.complaints?.length ?? 0} kayıt)`);
    } else note(`guest-complaints → ${res.status}`);
  } catch (err) {
    note(`guest-complaints — ${err instanceof Error ? err.message : String(err)}`);
  }

  try {
    const { res, ms } = await timed('/api/vip-guests', 10_000);
    if (res.ok) {
      const j = await res.json();
      pass(`VIP API (${ms} ms, ${j.guests?.length ?? 0} kayıt)`);
    } else note(`vip-guests → ${res.status}`);
  } catch (err) {
    note(`vip-guests — ${err instanceof Error ? err.message : String(err)}`);
  }

  try {
    const { res, ms } = await timed('/api/fnb/banket', 10_000);
    if (res.ok) {
      const j = await res.json();
      pass(`banket API (${ms} ms, ${j.events?.length ?? 0} etkinlik)`);
    } else note(`fnb banket → ${res.status}`);
  } catch (err) {
    note(`fnb banket — ${err instanceof Error ? err.message : String(err)}`);
  }

  try {
    const { res, ms } = await timed('/api/reports/templates', 10_000);
    if (res.ok) {
      const j = await res.json();
      pass(`rapor şablon API (${ms} ms, ${j.templates?.length ?? 0} şablon)`);
    } else note(`report templates → ${res.status}`);
  } catch (err) {
    note(`report templates — ${err instanceof Error ? err.message : String(err)}`);
  }

  try {
    const { res, ms } = await timed('/api/reports/consolidated', 15_000);
    if (res.ok) {
      const j = await res.json();
      pass(`konsolide rapor API (${ms} ms, ${j.properties?.length ?? j.totals ? 'ok' : '?'})`);
    } else note(`reports consolidated → ${res.status}`);
  } catch (err) {
    note(`reports consolidated — ${err instanceof Error ? err.message : String(err)}`);
  }

  try {
    const { res, ms } = await timed('/api/monitoring/sla', 15_000);
    if (res.ok) {
      const j = await res.json();
      pass(`SLA monitoring API (${ms} ms, health=${j.sla?.healthOk ? 'ok' : '?'})`);
    } else note(`monitoring/sla → ${res.status}`);
  } catch (err) {
    note(`monitoring/sla — ${err instanceof Error ? err.message : String(err)}`);
  }

  try {
    const { res, ms } = await timed('/api/lost-found', 10_000);
    if (res.ok) {
      const j = await res.json();
      pass(`kayıp-buluntu API (${ms} ms, ${j.items?.length ?? 0} kayıt)`);
    } else note(`lost-found → ${res.status}`);
  } catch (err) {
    note(`lost-found — ${err instanceof Error ? err.message : String(err)}`);
  }

  try {
    const { res, ms } = await timed('/api/guest-reviews', 10_000);
    if (res.ok) {
      const j = await res.json();
      pass(`misafir yorum API (${ms} ms, ${j.reviews?.length ?? 0} yorum)`);
    } else note(`guest-reviews → ${res.status}`);
  } catch (err) {
    note(`guest-reviews — ${err instanceof Error ? err.message : String(err)}`);
  }

  try {
    const { res, ms } = await timed('/api/repeat-guests', 15_000);
    if (res.ok) {
      const j = await res.json();
      pass(`tekrarlayan misafir API (${ms} ms, ${j.guests?.length ?? 0} misafir)`);
    } else note(`repeat-guests → ${res.status}`);
  } catch (err) {
    note(`repeat-guests — ${err instanceof Error ? err.message : String(err)}`);
  }

  try {
    const { res, ms } = await timed('/api/master-codes?kind=market', 10_000);
    if (res.ok) {
      const j = await res.json();
      pass(`master kod API (${ms} ms, ${j.codes?.length ?? 0} market)`);
    } else note(`master-codes → ${res.status}`);
  } catch (err) {
    note(`master-codes — ${err instanceof Error ? err.message : String(err)}`);
  }

  try {
    const { res, ms } = await timed('/api/info-rack', 10_000);
    if (res.ok) {
      const j = await res.json();
      pass(`info rack API (${ms} ms, ${j.rows?.length ?? 0} satır)`);
    } else note(`info-rack → ${res.status}`);
  } catch (err) {
    note(`info-rack — ${err instanceof Error ? err.message : String(err)}`);
  }

  try {
    const { res, ms } = await timed('/api/facility-bookings?kind=restaurant', 10_000);
    if (res.ok) {
      const j = await res.json();
      pass(`restoran rez. API (${ms} ms, ${j.bookings?.length ?? 0} kayıt)`);
    } else note(`facility-bookings → ${res.status}`);
  } catch (err) {
    note(`facility-bookings — ${err instanceof Error ? err.message : String(err)}`);
  }

  try {
    const { res, ms } = await timed('/api/reclamations', 10_000);
    if (res.ok) {
      const j = await res.json();
      pass(`reklamasyon API (${ms} ms, ${j.cases?.length ?? 0} kayıt)`);
    } else note(`reclamations → ${res.status}`);
  } catch (err) {
    note(`reclamations — ${err instanceof Error ? err.message : String(err)}`);
  }

  try {
    const { res, ms } = await timed('/api/master-codes?kind=department', 10_000);
    if (res.ok) {
      const j = await res.json();
      pass(`departman kod API (${ms} ms, ${j.codes?.length ?? 0} kod)`);
    } else note(`department codes → ${res.status}`);
  } catch (err) {
    note(`department codes — ${err instanceof Error ? err.message : String(err)}`);
  }

  try {
    const { res, ms } = await timed('/api/gr-inhouse', 10_000);
    if (res.ok) {
      const j = await res.json();
      pass(`GR in-house API (${ms} ms, ${j.total ?? 0} konaklayan)`);
    } else note(`gr-inhouse → ${res.status}`);
  } catch (err) {
    note(`gr-inhouse — ${err instanceof Error ? err.message : String(err)}`);
  }

  try {
    const { res, ms } = await timed('/api/guest-activities?view=stats', 10_000);
    if (res.ok) pass(`GR operasyon özeti API (${ms} ms)`);
    else note(`guest-activities stats → ${res.status}`);
  } catch (err) {
    note(`guest-activities stats — ${err instanceof Error ? err.message : String(err)}`);
  }

  try {
    const { res, ms } = await timed('/api/guest-activities?view=daily', 10_000);
    if (res.ok) {
      const j = await res.json();
      pass(`günlük aktivite API (${ms} ms, ${j.activities?.length ?? 0} kayıt)`);
    } else note(`daily activities → ${res.status}`);
  } catch (err) {
    note(`daily activities — ${err instanceof Error ? err.message : String(err)}`);
  }

  try {
    const { res, ms } = await timed('/api/master-codes?kind=nationality', 10_000);
    if (res.ok) {
      const j = await res.json();
      pass(`uyruk kod API (${ms} ms, ${j.codes?.length ?? 0} kod)`);
    } else note(`nationality codes → ${res.status}`);
  } catch (err) {
    note(`nationality codes — ${err instanceof Error ? err.message : String(err)}`);
  }

  try {
    const { res, ms } = await timed('/api/extra-charges', 10_000);
    if (res.ok) {
      const j = await res.json();
      pass(`ek ücret API (${ms} ms, ${j.charges?.length ?? 0} kayıt)`);
    } else note(`extra-charges → ${res.status}`);
  } catch (err) {
    note(`extra-charges — ${err instanceof Error ? err.message : String(err)}`);
  }

  try {
    const { res, ms } = await timed('/api/property-languages', 10_000);
    if (res.ok) {
      const j = await res.json();
      pass(`dil tanım API (${ms} ms, ${j.languages?.length ?? 0} dil)`);
    } else note(`property-languages → ${res.status}`);
  } catch (err) {
    note(`property-languages — ${err instanceof Error ? err.message : String(err)}`);
  }

  try {
    const { res, ms } = await timed('/api/weather', 15_000);
    if (res.ok) {
      const j = await res.json();
      pass(`hava durumu API (${ms} ms, kaynak=${j.today?.source ?? '?'})`);
    } else note(`weather → ${res.status}`);
  } catch (err) {
    note(`weather — ${err instanceof Error ? err.message : String(err)}`);
  }

  try {
    const { res, ms } = await timed('/api/operations/summary', 15_000);
    if (res.ok) {
      const j = await res.json();
      pass(`operasyon özeti API (${ms} ms, ${j.summary?.alerts?.length ?? 0} uyarı)`);
    } else note(`operations summary → ${res.status}`);
  } catch (err) {
    note(`operations summary — ${err instanceof Error ? err.message : String(err)}`);
  }

  try {
    const { res, ms } = await timed('/api/room-blocks', 10_000);
    if (res.ok) {
      const j = await res.json();
      pass(`oda blokaj API (${ms} ms, ${j.blocks?.length ?? 0} kayıt)`);
    } else note(`room-blocks → ${res.status}`);
  } catch (err) {
    note(`room-blocks — ${err instanceof Error ? err.message : String(err)}`);
  }

  try {
    const { res, ms } = await timed('/api/master-codes?kind=revenue_group', 10_000);
    if (res.ok) {
      const j = await res.json();
      pass(`gelir grup API (${ms} ms, ${j.codes?.length ?? 0} kod)`);
    } else note(`revenue_group codes → ${res.status}`);
  } catch (err) {
    note(`revenue_group codes — ${err instanceof Error ? err.message : String(err)}`);
  }

  try {
    const { res, ms } = await timed('/api/meal-prices', 10_000);
    if (res.ok) {
      const j = await res.json();
      pass(`pansiyon fiyat API (${ms} ms, ${j.prices?.length ?? 0} kayıt)`);
    } else note(`meal-prices → ${res.status}`);
  } catch (err) {
    note(`meal-prices — ${err instanceof Error ? err.message : String(err)}`);
  }

  try {
    const { res, ms } = await timed('/api/hotel-seasons', 10_000);
    if (res.ok) {
      const j = await res.json();
      pass(`otel sezon API (${ms} ms, ${j.seasons?.length ?? 0} sezon)`);
    } else note(`hotel-seasons → ${res.status}`);
  } catch (err) {
    note(`hotel-seasons — ${err instanceof Error ? err.message : String(err)}`);
  }

  try {
    const { res, ms } = await timed('/api/config-params', 10_000);
    if (res.ok) {
      const j = await res.json();
      pass(`config param API (${ms} ms, ${j.params?.length ?? 0} parametre)`);
    } else note(`config-params → ${res.status}`);
  } catch (err) {
    note(`config-params — ${err instanceof Error ? err.message : String(err)}`);
  }

  try {
    const { res, ms } = await timed('/api/warehouses', 10_000);
    if (res.ok) {
      const j = await res.json();
      pass(`depo tanım API (${ms} ms, ${j.warehouses?.length ?? 0} depo)`);
    } else note(`warehouses → ${res.status}`);
  } catch (err) {
    note(`warehouses — ${err instanceof Error ? err.message : String(err)}`);
  }

  try {
    const { res, ms } = await timed('/api/fiscal-devices', 10_000);
    if (res.ok) {
      const j = await res.json();
      pass(`yazarkasa API (${ms} ms, ${j.devices?.length ?? 0} cihaz)`);
    } else note(`fiscal-devices → ${res.status}`);
  } catch (err) {
    note(`fiscal-devices — ${err instanceof Error ? err.message : String(err)}`);
  }

  try {
    const { res, ms } = await timed('/api/business-date', 10_000);
    if (res.ok) {
      const j = await res.json();
      pass(`program tarihi API (${ms} ms, iş günü=${j.businessDate ?? '?'})`);
    } else note(`business-date → ${res.status}`);
  } catch (err) {
    note(`business-date — ${err instanceof Error ? err.message : String(err)}`);
  }

  try {
    const { res, ms } = await timed('/api/property-branches', 10_000);
    if (res.ok) {
      const j = await res.json();
      pass(`şube tanım API (${ms} ms, ${j.branches?.length ?? 0} şube)`);
    } else note(`property-branches → ${res.status}`);
  } catch (err) {
    note(`property-branches — ${err instanceof Error ? err.message : String(err)}`);
  }

  try {
    const { res, ms } = await timed('/api/user-groups', 10_000);
    if (res.ok) {
      const j = await res.json();
      const hasIdentityRead = j.groups?.some((g) =>
        g.permissions?.includes('identity.read'),
      );
      pass(`kullanıcı grup API (${ms} ms, ${j.groups?.length ?? 0} grup${hasIdentityRead ? ', identity.read var' : ''})`);
    } else if (res.status === 403) {
      note(`user-groups → ${res.status} (settings.admin veya identity.read)`);
    } else {
      note(`user-groups → ${res.status}`);
    }
  } catch (err) {
    note(`user-groups — ${err instanceof Error ? err.message : String(err)}`);
  }

  try {
    const { res, ms } = await timed('/api/room-type-defs', 10_000);
    if (res.ok) {
      const j = await res.json();
      pass(`oda tipi API (${ms} ms, ${j.types?.length ?? 0} tip)`);
    } else note(`room-type-defs → ${res.status}`);
  } catch (err) {
    note(`room-type-defs — ${err instanceof Error ? err.message : String(err)}`);
  }

  try {
    const { res, ms } = await timed('/api/property-floors', 10_000);
    if (res.ok) {
      const j = await res.json();
      pass(`kat tanım API (${ms} ms, ${j.floors?.length ?? 0} kat)`);
    } else note(`property-floors → ${res.status}`);
  } catch (err) {
    note(`property-floors — ${err instanceof Error ? err.message : String(err)}`);
  }

  try {
    const { res, ms } = await timed('/api/property-rooms?limit=10', 10_000);
    if (res.ok) {
      const j = await res.json();
      pass(`oda envanter API (${ms} ms, toplam=${j.total ?? 0})`);
    } else note(`property-rooms → ${res.status}`);
  } catch (err) {
    note(`property-rooms — ${err instanceof Error ? err.message : String(err)}`);
  }

  try {
    const { res, ms } = await timed('/api/user-params', 10_000);
    if (res.ok) {
      const j = await res.json();
      pass(`kullanıcı param API (${ms} ms, ${j.params?.length ?? 0} kayıt)`);
    } else note(`user-params → ${res.status}`);
  } catch (err) {
    note(`user-params — ${err instanceof Error ? err.message : String(err)}`);
  }

  try {
    const { res, ms } = await timed('/api/property-inventory', 10_000);
    if (res.ok) {
      const j = await res.json();
      pass(`oda envanteri API (${ms} ms, ${j.totalRooms ?? 0} oda)`);
    } else note(`property-inventory → ${res.status}`);
  } catch (err) {
    note(`property-inventory — ${err instanceof Error ? err.message : String(err)}`);
  }

  try {
    const { res, ms } = await timed('/api/market-required', 10_000);
    if (res.ok) {
      const j = await res.json();
      pass(`market zorunlu API (${ms} ms, required=${j.required ? 'evet' : 'hayır'})`);
    } else note(`market-required → ${res.status}`);
  } catch (err) {
    note(`market-required — ${err instanceof Error ? err.message : String(err)}`);
  }

  try {
    const { res, ms } = await timed('/api/property-profile', 10_000);
    if (res.ok) {
      const j = await res.json();
      pass(`otel profili API (${ms} ms, ${j.profile?.name ?? '?'})`);
    } else note(`property-profile → ${res.status}`);
  } catch (err) {
    note(`property-profile — ${err instanceof Error ? err.message : String(err)}`);
  }

  try {
    const res = await authFetch('/api/eod/night-posting', {
      method: 'POST',
      body: JSON.stringify({ user: 'checklist' }),
      signal: AbortSignal.timeout(15_000),
    });
    if (res.ok) {
      const j = await res.json();
      pass(`gece basım API (oda=${j.result?.roomCharges ?? 0}, ek=${j.result?.extraCharges ?? 0})`);
    } else note(`night-posting → ${res.status}`);
  } catch (err) {
    note(`night-posting — ${err instanceof Error ? err.message : String(err)}`);
  }

  try {
    const res = await authFetch('/api/eod/night-audit-package', {
      method: 'POST',
      body: JSON.stringify({ email: 'checklist@roomio.local' }),
      signal: AbortSignal.timeout(15_000),
    });
    if (res.ok) {
      const j = await res.json();
      pass(`gece denetim e-posta kuyruğu (status=${j.mailStatus ?? '?'})`);
    } else note(`night-audit notify → ${res.status}`);
  } catch (err) {
    note(`night-audit notify — ${err instanceof Error ? err.message : String(err)}`);
  }

  try {
    const { res, ms } = await timed('/api/reservations', 10_000);
    if (res.ok) {
      const j = await res.json();
      pass(`rezervasyon listesi API (${ms} ms, ${j.count ?? j.reservations?.length ?? 0} kayıt)`);
    } else note(`reservations → ${res.status}`);
  } catch (err) {
    note(`reservations list — ${err instanceof Error ? err.message : String(err)}`);
  }

  try {
    const stamp = Date.now();
    const postStart = performance.now();
    const res = await authFetch('/api/reservations', {
      method: 'POST',
      body: JSON.stringify({
        id: `chk-res-${stamp}`,
        refNo: `CHK-${stamp}`,
        guestName: 'Checklist Guest',
        checkIn: '2026-08-01',
        checkOut: '2026-08-03',
        roomType: 'DBL',
        adults: 2,
        children: 0,
        mealPlan: 'BB',
        rate: 4500,
        currency: 'TRY',
        agency: 'Direct',
        market: 'BAR',
        status: 'CONFIRMED',
        createdAt: new Date().toISOString().slice(0, 10),
      }),
      signal: AbortSignal.timeout(15_000),
    });
    const postMs = Math.round(performance.now() - postStart);
    if (res.ok) {
      const j = await res.json();
      pass(`rezervasyon POST API (${postMs} ms, ref=${j.reservation?.refNo ?? '?'})`);
    } else if (res.status === 403) {
      note(`rezervasyon POST → 403 (reservations.write)`);
    } else {
      note(`rezervasyon POST → ${res.status}`);
    }
  } catch (err) {
    note(`rezervasyon POST — ${err instanceof Error ? err.message : String(err)}`);
  }

  try {
    const { res, ms } = await timed('/api/reservations?id=demo-check', 10_000);
    if (res.status === 404) pass(`rezervasyon tekil GET (${ms} ms, 404 beklenen)`);
    else if (res.ok) pass(`rezervasyon tekil GET (${ms} ms)`);
    else note(`reservations?id → ${res.status}`);
  } catch (err) {
    note(`reservations tekil — ${err instanceof Error ? err.message : String(err)}`);
  }

  try {
    const { res, ms } = await timed('/api/reservations/groups', 10_000);
    if (res.ok) {
      const j = await res.json();
      pass(`grup rezervasyon API (${ms} ms, ${j.groups?.length ?? 0} grup)`);
    } else note(`reservations/groups → ${res.status}`);
  } catch (err) {
    note(`reservations/groups — ${err instanceof Error ? err.message : String(err)}`);
  }

  try {
    const { res, ms } = await timed('/api/reservations/groups?view=pickup-report', 15_000);
    if (res.ok) {
      const j = await res.json();
      pass(`grup pickup raporu (${ms} ms, ${j.report?.rows?.length ?? 0} satır)`);
    } else note(`pickup report → ${res.status}`);
  } catch (err) {
    note(`pickup report — ${err instanceof Error ? err.message : String(err)}`);
  }

  // 3 örnek health — sıcak latency
  const samples = [];
  for (let i = 0; i < 3; i += 1) {
    try {
      const { ms } = await timed('/api/health');
      samples.push(ms);
    } catch {
      samples.push(-1);
    }
  }
  const valid = samples.filter((m) => m >= 0);
  const avg = valid.length ? Math.round(valid.reduce((a, b) => a + b, 0) / valid.length) : -1;
  if (avg >= 0 && avg < 3000) pass(`health ortalama latency: ${avg} ms`);
  else if (avg >= 0) note(`health ortalama latency yüksek: ${avg} ms`);
}

await probeLive();

console.log('\n' + (ok ? '✓ Checklist geçti' : '✗ Checklist başarısız'));
if (warn.length) console.log(`  (${warn.length} uyarı — kritik değil)`);
console.log('\nDetay: references/PRODUCTION-DEPLOY-CHECKLIST.md\n');
process.exit(ok ? 0 : 1);
