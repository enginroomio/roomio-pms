#!/usr/bin/env node
/**
 * VAPID anahtar üretimi (.env snippet).
 * Kullanım: npm run vapid:gen
 */
import { execSync } from 'node:child_process';
import { writeFileSync } from 'node:fs';

const out = execSync('npx web-push generate-vapid-keys', { encoding: 'utf8' });
const publicKey = out.match(/Public Key:\s*(.+)/)?.[1]?.trim();
const privateKey = out.match(/Private Key:\s*(.+)/)?.[1]?.trim();

if (!publicKey || !privateKey) {
  console.error('VAPID anahtarları üretilemedi');
  process.exit(1);
}

const snippet = `# Roomio HK push (Faz 6)
VAPID_PUBLIC_KEY=${publicKey}
VAPID_PRIVATE_KEY=${privateKey}
VAPID_SUBJECT=mailto:hk@hotelsapphire.com
`;

writeFileSync('.env.vapid.generated', snippet, 'utf8');
console.log('✓ .env.vapid.generated oluşturuldu');
console.log('\n' + snippet);
console.log('Bu satırları .env.local dosyanıza ekleyin ve sunucuyu yeniden başlatın.');
