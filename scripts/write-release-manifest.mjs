#!/usr/bin/env node
import { execSync } from 'node:child_process';
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const pkg = JSON.parse(readFileSync(join(ROOT, 'package.json'), 'utf8'));

function gitShortSha() {
  try {
    return execSync('git rev-parse --short HEAD', { cwd: ROOT, encoding: 'utf8' }).trim();
  } catch {
    return null;
  }
}

function gitBranch() {
  try {
    return execSync('git rev-parse --abbrev-ref HEAD', { cwd: ROOT, encoding: 'utf8' }).trim();
  } catch {
    return null;
  }
}

const builtAt = new Date().toISOString();
const launchId = `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;

const manifest = {
  version: pkg.version,
  name: pkg.name,
  builtAt,
  launchId,
  gitSha: gitShortSha(),
  gitBranch: gitBranch(),
  label: `Roomio v${pkg.version} · ${new Date(builtAt).toLocaleString('tr-TR', { dateStyle: 'medium', timeStyle: 'short' })}`,
};

const publicDir = join(ROOT, 'public');
mkdirSync(publicDir, { recursive: true });
mkdirSync(join(ROOT, '.roomio'), { recursive: true });
writeFileSync(join(publicDir, 'release-manifest.json'), `${JSON.stringify(manifest, null, 2)}\n`, 'utf8');
writeFileSync(join(ROOT, '.roomio', 'last-release.json'), `${JSON.stringify(manifest, null, 2)}\n`, 'utf8');

console.log('[release]', manifest.label);
if (manifest.gitSha) console.log('[release] Git:', manifest.gitSha, manifest.gitBranch ?? '');
