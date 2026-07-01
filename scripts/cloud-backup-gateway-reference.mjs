#!/usr/bin/env node
/**
 * Referans bulut yedek gateway — geliştirme / test için.
 * Kullanım: node scripts/cloud-backup-gateway-reference.mjs
 *          ROOMIO_CLOUD_BACKUP_GATEWAY_URL=http://127.0.0.1:3921/upload npm run dev
 */
import http from 'node:http';
import fs from 'node:fs/promises';
import path from 'node:path';

const PORT = Number(process.env.ROOMIO_BACKUP_GATEWAY_PORT ?? 3921);
const STORE = process.env.ROOMIO_BACKUP_GATEWAY_STORE
  ?? path.join(process.cwd(), '.roomio-data', 'gateway-backups');

const server = http.createServer(async (req, res) => {
  if (req.method !== 'POST') {
    res.writeHead(405);
    res.end('POST only');
    return;
  }

  const chunks = [];
  for await (const chunk of req) chunks.push(chunk);
  const raw = Buffer.concat(chunks).toString('utf8');
  let body;
  try {
    body = JSON.parse(raw);
  } catch {
    res.writeHead(400);
    res.end(JSON.stringify({ ok: false, message: 'invalid json' }));
    return;
  }

  await fs.mkdir(STORE, { recursive: true });

  if (body.action === 'prune') {
    const items = Array.isArray(body.items) ? body.items : [];
    let removed = 0;
    for (const item of items) {
      const name = item.fileName ?? path.basename(item.remotePath ?? '');
      if (!name) continue;
      try {
        await fs.unlink(path.join(STORE, name));
        removed += 1;
      } catch {
        // dosya yoksa atla
      }
    }
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ ok: true, removed, message: `${removed} dosya silindi` }));
    return;
  }

  const fileName = body.fileName ?? `backup-${Date.now()}.tar.gz`;
  const content = body.contentBase64 ? Buffer.from(body.contentBase64, 'base64') : Buffer.from('');
  const dest = path.join(STORE, fileName);
  await fs.writeFile(dest, content);
  const remotePath = `${body.provider ?? 'local'}://${STORE}/${fileName}`;

  res.writeHead(200, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify({ ok: true, remotePath, path: remotePath, message: `Kaydedildi: ${fileName}` }));
});

server.listen(PORT, '127.0.0.1', () => {
  console.log(`[roomio/gateway-backup] http://127.0.0.1:${PORT} → ${STORE}`);
});
