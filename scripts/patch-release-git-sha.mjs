#!/usr/bin/env node
/** release-manifest.json gitSha — build ortamında .git yoksa runtime commit ile düzelt. */
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const sha = process.env.RENDER_GIT_COMMIT?.trim() || process.env.GITHUB_SHA?.trim();
if (!sha) {
  process.exit(0);
}

const short = sha.slice(0, 7);
const targets = [join(process.cwd(), 'public', 'release-manifest.json')];

for (const path of targets) {
  if (!existsSync(path)) continue;
  try {
    const manifest = JSON.parse(readFileSync(path, 'utf8'));
    if (manifest.gitSha === short) continue;
    manifest.gitSha = short;
    writeFileSync(path, `${JSON.stringify(manifest, null, 2)}\n`, 'utf8');
    console.log(`[release] gitSha=${short} → ${path}`);
  } catch {
    /* ignore */
  }
}
