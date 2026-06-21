#!/usr/bin/env node
/**
 * Render.com production yardımcıları.
 */
import { existsSync, readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { join } from 'node:path';

const ROOT = process.cwd();
const URL_FILE = join(ROOT, '.roomio', 'production-url.txt');
const SERVICE_NAME = 'roomio-pms';

export function defaultRenderUrl(name = SERVICE_NAME) {
  return `https://${name}.onrender.com`;
}

export function productionUrl() {
  const fromEnv = process.env.ROOMIO_PRODUCTION_URL?.trim();
  if (fromEnv) return fromEnv.replace(/\/$/, '');
  try {
    const fromFile = readFileSync(URL_FILE, 'utf8').trim();
    if (fromFile) return fromFile.replace(/\/$/, '');
  } catch {
    /* ignore */
  }
  return null;
}

export function saveProductionUrl(url) {
  mkdirSync(join(ROOT, '.roomio'), { recursive: true });
  writeFileSync(URL_FILE, `${url.replace(/\/$/, '')}\n`, 'utf8');
}

export async function waitForHealth(base, attempts = 40, intervalMs = 5000) {
  let lastStatus = 0;
  for (let i = 0; i < attempts; i += 1) {
    try {
      const res = await fetch(`${base.replace(/\/$/, '')}/api/health`);
      lastStatus = res.status;
      if (res.status === 404 && i >= 2) {
        return { ok: false, body: null, reason: 'not_found' };
      }
      if (res.ok) {
        const body = await res.json().catch(() => ({}));
        if (body.ok === true) return { ok: true, body };
      }
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      if (msg.includes('ENOTFOUND') || msg.includes('getaddrinfo')) {
        return { ok: false, body: null, reason: 'dns' };
      }
    }
    if (i === 0) console.log('ℹ Render cold start bekleniyor (30–60 sn)…');
    await new Promise((r) => setTimeout(r, intervalMs));
  }
  return { ok: false, body: null, reason: lastStatus ? `http_${lastStatus}` : 'timeout' };
}

export function renderServiceName() {
  if (!existsSync('render.yaml')) return SERVICE_NAME;
  const match = readFileSync('render.yaml', 'utf8').match(/^\s*name:\s*(\S+)/m);
  return match?.[1] ?? SERVICE_NAME;
}
