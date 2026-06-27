#!/usr/bin/env node
/** Çoklu tesis (İstanbul + Antalya) smoke testi */
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

const BASE = process.env.ROOMIO_URL ?? readActivePort() ?? 'http://127.0.0.1:3100';

function readActivePort() {
  try {
    const port = readFileSync(join(process.cwd(), '.roomio/runtime/active-port.txt'), 'utf8').trim();
    return port ? `http://127.0.0.1:${port}` : null;
  } catch {
    return null;
  }
}

let ok = true;
console.log(`Multi-property test → ${BASE}\n`);

const res = await fetch(`${BASE}/api/properties`);
const body = await res.json().catch(() => ({}));
const props = body.properties ?? [];
const propsOk = res.ok && props.length >= 2;
console.log(`${propsOk ? '✓' : '✗'} /api/properties — ${props.length} tesis [${res.status}]`);
ok = propsOk && ok;

for (const city of ['İstanbul', 'Antalya']) {
  const hit = props.some((p) => p.city === city);
  console.log(`${hit ? '✓' : '✗'} Tesis — ${city}`);
  ok = hit && ok;
}

const ist = props.find((p) => p.city === 'İstanbul');
const ant = props.find((p) => p.city === 'Antalya');
if (ist && ant) {
  const share = await fetch(`${BASE}/api/reports/templates/share`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-roomio-property-id': ist.id,
    },
    body: JSON.stringify({ templateId: 'tpl-fo-daily', targetPropertyIds: [ant.id] }),
  });
  const shareOk = share.status === 200;
  console.log(`${shareOk ? '✓' : '✗'} Şablon paylaşımı — İstanbul → Antalya [${share.status}]`);
  ok = shareOk && ok;
}

console.log(ok ? '\n✓ Multi-property geçti\n' : '\n✗ Multi-property başarısız\n');
process.exit(ok ? 0 : 1);
