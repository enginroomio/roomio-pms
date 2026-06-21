#!/usr/bin/env node
/** flyctl binary kurulumu → .roomio/bin/fly */
import { chmodSync, existsSync, mkdirSync } from 'node:fs';
import { join } from 'node:path';
import { pipeline } from 'node:stream/promises';
import { createWriteStream } from 'node:fs';
import { execSync, spawnSync } from 'node:child_process';

const ROOT = process.cwd();
const BIN_DIR = join(ROOT, '.roomio', 'bin');
const FLY_BIN = join(BIN_DIR, 'fly');

export function localFlyBin() {
  return existsSync(FLY_BIN) ? FLY_BIN : null;
}

function archTag() {
  const map = { arm64: 'arm64', x64: 'amd64' };
  return map[process.arch] ?? 'arm64';
}

function platformTag() {
  return process.platform === 'darwin' ? 'darwin' : process.platform === 'linux' ? 'linux' : null;
}

async function fetchJson(url) {
  const res = await fetch(url, { headers: { 'User-Agent': 'roomio-pms' } });
  if (!res.ok) throw new Error(`HTTP ${res.status} ${url}`);
  return res.json();
}

async function downloadRelease(version, assetName) {
  const url = `https://github.com/superfly/flyctl/releases/download/v${version}/${assetName}`;
  const res = await fetch(url, { headers: { 'User-Agent': 'roomio-pms' } });
  if (!res.ok) throw new Error(`Download failed ${res.status} ${url}`);
  mkdirSync(BIN_DIR, { recursive: true });
  const tarPath = join(BIN_DIR, assetName);
  await pipeline(res.body, createWriteStream(tarPath));
  execSync(`tar -xzf "${tarPath}" -C "${BIN_DIR}"`, { stdio: 'inherit' });
  execSync(`rm -f "${tarPath}"`, { stdio: 'ignore', shell: true });
  if (existsSync(FLY_BIN)) chmodSync(FLY_BIN, 0o755);
}

export async function ensureFlyInstalled() {
  if (localFlyBin()) return FLY_BIN;
  if (spawnSync('fly', ['version'], { stdio: 'ignore' }).status === 0) return 'fly';
  return installFlyToProject();
}

export async function installFlyToProject() {
  if (localFlyBin()) return FLY_BIN;

  const platform = platformTag();
  if (!platform) throw new Error(`Desteklenmeyen platform: ${process.platform}`);

  const release = await fetchJson('https://api.github.com/repos/superfly/flyctl/releases/latest');
  const version = String(release.tag_name).replace(/^v/, '');
  const assetName = `flyctl_${version}_${platform}_${archTag()}.tar.gz`;
  const hasAsset = release.assets?.some((a) => a.name === assetName);
  if (!hasAsset) throw new Error(`Asset bulunamadı: ${assetName}`);

  console.log(`ℹ flyctl v${version} indiriliyor…`);
  await downloadRelease(version, assetName);
  if (!existsSync(FLY_BIN)) throw new Error('fly binary çıkarılamadı');
  console.log(`✓ flyctl kuruldu → ${FLY_BIN}`);
  return FLY_BIN;
}

if (import.meta.url === `file://${process.argv[1]}`) {
  try {
    await installFlyToProject();
  } catch (e) {
    console.error(`✗ ${e instanceof Error ? e.message : e}`);
    console.error('  Manuel: brew install flyctl');
    process.exit(1);
  }
}
