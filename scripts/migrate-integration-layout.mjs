#!/usr/bin/env node
/**
 * PageHeader kullanan entegrasyon sayfalarını IntegrationPageLayout'a taşır.
 */
import { readdirSync, readFileSync, statSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const ROOT = join(process.cwd(), 'app/settings/integrations');
const SKIP = new Set([
  'page.tsx',
  'pbx/page.tsx',
  'tesa/TesaIntegrationPageClient.tsx',
]);

function walk(dir, out = []) {
  for (const name of readdirSync(dir)) {
    const p = join(dir, name);
    const rel = p.slice(ROOT.length + 1);
    if (statSync(p).isDirectory()) walk(p, out);
    else if (name.endsWith('.tsx')) out.push(rel);
  }
  return out;
}

function parseAttr(block, name) {
  const dbl = block.match(new RegExp(`${name}="([^"]*)"`));
  if (dbl) return dbl[1];
  const single = block.match(new RegExp(`${name}='([^']*)'`));
  if (single) return single[1];
  const brace = block.match(new RegExp(`${name}=\\{([^}]+)\\}`));
  if (brace) return brace[1].replace(/^['"`]|['"`]$/g, '');
  return null;
}

function extractActions(attrs) {
  const idx = attrs.indexOf('actions={');
  if (idx === -1) return null;
  let depth = 0;
  let start = idx + 'actions='.length;
  if (attrs[start] !== '{') return null;
  for (let i = start; i < attrs.length; i++) {
    if (attrs[i] === '{') depth++;
    else if (attrs[i] === '}') {
      depth--;
      if (depth === 0) return attrs.slice(start + 1, i).trim();
    }
  }
  return null;
}

function hasCustomActions(actionsBlock) {
  if (!actionsBlock) return false;
  const stripped = actionsBlock
    .replace(/<Button[^>]*href=["']\/settings\/integrations["'][^>]*>[\s\S]*?<\/Button>/g, '')
    .replace(/←\s*Entegrasyonlar/g, '')
    .replace(/\s+/g, '')
    .trim();
  return stripped.length > 0;
}

function migrateFile(rel) {
  if (SKIP.has(rel)) return { rel, status: 'skipped' };
  const path = join(ROOT, rel);
  let content = readFileSync(path, 'utf8');
  if (!content.includes('PageHeader')) return { rel, status: 'no-pageheader' };

  const openMatch = content.match(/<PageHeader\s+([\s\S]*?)>\s*\n/);
  if (!openMatch) return { rel, status: 'parse-fail' };

  const attrs = openMatch[1];
  const title = parseAttr(attrs, 'title');
  if (!title) return { rel, status: 'no-title' };

  const description = parseAttr(attrs, 'description');
  const actionsBlock = extractActions(attrs);
  const customActions = hasCustomActions(actionsBlock) ? actionsBlock : null;

  if (!content.includes("from '@/components/PageHeader'")) {
    return { rel, status: 'import-missing' };
  }

  content = content.replace(
    "import { PageHeader } from '@/components/PageHeader';",
    "import { IntegrationPageLayout } from '@/components/sistem/IntegrationPageLayout';",
  );

  const descLine = description ? `description={${JSON.stringify(description)}}\n      ` : '';
  const layoutOpen = customActions
    ? `<IntegrationPageLayout\n      segment={${JSON.stringify(title)}}\n      title={${JSON.stringify(title)}}\n      ${descLine}actions={${customActions}}\n    >`
    : `<IntegrationPageLayout\n      segment={${JSON.stringify(title)}}\n      title={${JSON.stringify(title)}}\n      ${descLine}>`;

  content = content.replace(/<PageHeader\s+[\s\S]*?>\s*\n/, `${layoutOpen}\n`);
  content = content.replace(/<\/PageHeader>/g, '</IntegrationPageLayout>');

  writeFileSync(path, content);
  return { rel, status: 'migrated', title };
}

const results = walk(ROOT).map(migrateFile);
const migrated = results.filter((r) => r.status === 'migrated');
const failed = results.filter((r) => ['parse-fail', 'no-title', 'import-missing'].includes(r.status));

console.log(`Migrated: ${migrated.length}`);
for (const r of migrated) console.log(`  ✓ ${r.rel}`);
if (failed.length) {
  console.log(`Failed: ${failed.length}`);
  for (const r of failed) console.log(`  ✗ ${r.rel} (${r.status})`);
}
