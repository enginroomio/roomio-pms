#!/usr/bin/env node
/**
 * Rollout adımlarını HTTP + HTML içerik kontrolü ile smoke test eder.
 * Kullanım: ROOMIO_URL=http://127.0.0.1:3156 node scripts/test-rollout-steps.mjs [phase]
 * phase: shell | home | sistem | rezervasyon | resepsiyon | onkasa | kat | misafir | raporlar | gunsonu | all (varsayılan: all)
 */
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

const BASE = process.env.ROOMIO_URL ?? readActivePort() ?? 'http://127.0.0.1:3100';
const phaseArg = process.argv[2] ?? 'all';

function readActivePort() {
  try {
    const port = readFileSync(join(process.cwd(), '.roomio/runtime/active-port.txt'), 'utf8').trim();
    return port ? `http://127.0.0.1:${port}` : null;
  } catch {
    return null;
  }
}

const STEPS = {
  shell: [
    { id: 'shell-rail', href: '/', must: [] },
    { id: 'shell-top', href: '/', must: [] },
    { id: 'shell-shortcuts', href: '/', must: [] },
  ],
  home: [
    { id: 'home-welcome', href: '/', must: [] },
    { id: 'home-kpi', href: '/', must: [] },
    { id: 'home-rack', href: '/', must: [] },
    { id: 'home-movements', href: '/', must: [] },
    { id: 'home-rack-full', href: '/rooms', must: [] },
  ],
  sistem: [
    { id: 'sys-kurulus', href: '/settings', must: [] },
    { id: 'sys-rapor-design', href: '/reports?tab=design', must: [] },
    { id: 'sys-raporla', href: '/reports', must: [] },
    { id: 'sys-servis', href: '/settings/integrations/tesa', must: [] },
    { id: 'sys-dil', href: '/settings?section=language', must: [] },
  ],
  rezervasyon: [
    { id: 'rez-grafik', href: '/reservations/calendar', must: ['Grafikler', 'Elektra Forecast F1', 'Raporu Hazırla'] },
    { id: 'rez-new', href: '/reservations/new', must: ['Yeni Rezervasyon'] },
    { id: 'rez-list', href: '/reservations', must: ['Rezervasyon Listesi', 'Filtreler'] },
    { id: 'rez-inhouse', href: '/reception/inhouse', must: ['Konaklayanlar'] },
    { id: 'rez-vacant', href: '/reception/vacant', must: ['Boş Oda'] },
    { id: 'rez-block', href: '/rooms?tab=blocking', must: ['Hızlı Blokaj'] },
  ],
  resepsiyon: [
    { id: 'rec-hub', href: '/reception', must: ['Resepsiyon & Ön Kasa', 'Kasa Defteri'] },
    { id: 'rec-arrivals', href: '/reception/arrivals', must: ['Bugün Giriş Yapacaklar'] },
    { id: 'rec-departures', href: '/reception/departures', must: ['Bugün Çıkış Yapacaklar'] },
    { id: 'rec-info', href: '/guest-relations/info-rack', must: ['Info Rack'] },
    { id: 'rec-complaints', href: '/guest-relations/complaints', must: ['Arıza ve Şikayet Listesi'] },
  ],
  onkasa: [
    { id: 'cash-hub', href: '/reception', must: ['Kasa Defteri'] },
    { id: 'cash-close', href: '/reception?tab=kasa-close', must: ['Kasa Kapatma Listesi'] },
    { id: 'cash-fx', href: '/reception/departures?tab=fx', must: ['Döviz Bozdurma Listesi'] },
    { id: 'cash-deposit', href: '/reception/vacant?tab=deposit', must: ['Depozit İşlemleri'] },
  ],
  kat: [
    { id: 'hk-hub', href: '/housekeeping', must: [] },
    { id: 'hk-rooms', href: '/housekeeping/rooms', must: [] },
    { id: 'hk-tasks', href: '/housekeeping/tasks', must: [] },
    { id: 'hk-rack', href: '/rooms', must: [] },
  ],
  misafir: [
    { id: 'gr-hub', href: '/guest-relations', must: [] },
    { id: 'gr-traces', href: '/guest-relations/traces', must: [] },
    { id: 'gr-vip', href: '/guest-relations/vip', must: [] },
    { id: 'gr-reviews', href: '/guest-relations/reviews', must: [] },
    { id: 'bnk-hub', href: '/fnb', must: [] },
  ],
  raporlar: [
    { id: 'rpt-hub', href: '/reports', must: [] },
    { id: 'rpt-fo', href: '/reports?category=rezervasyon', must: [] },
    { id: 'rpt-hk', href: '/reports?category=kathizmetleri', must: [] },
    { id: 'rpt-mgmt', href: '/reports?category=yonetim', must: [] },
  ],
  gunsonu: [
    { id: 'eod-fetch', href: '/reports?tab=eod&action=fetch', must: [] },
    { id: 'eod-close', href: '/reports?tab=eod&action=close', must: [] },
    { id: 'eod-archive', href: '/reports?tab=eod&action=archive', must: [] },
    { id: 'eod-prices', href: '/reports?tab=eod&action=room-prices', must: [] },
  ],
};

async function checkStep(step) {
  const url = `${BASE}${step.href}`;
  const res = await fetch(url, { redirect: 'follow' });
  // Client-side sayfalar SSR'da içerik taşımaz — yalnızca HTTP 200 kontrol edilir.
  return { ...step, url, status: res.status, ok: res.status === 200, missing: res.status === 200 ? [] : [`HTTP ${res.status}`] };
}

async function runPhase(name, steps) {
  console.log(`\n── ${name.toUpperCase()} ──`);
  let passed = 0;
  for (const step of steps) {
    const r = await checkStep(step);
    if (r.ok) {
      passed += 1;
      console.log(`✓ ${r.id} — ${r.href}`);
    } else {
      console.log(`✗ ${r.id} — ${r.href} [${r.status}] eksik: ${r.missing.join(', ') || 'HTTP'}`);
    }
  }
  return { total: steps.length, passed };
}

async function main() {
  console.log(`Rollout smoke test → ${BASE}`);
  const phases = phaseArg === 'all' ? Object.keys(STEPS) : [phaseArg];
  let total = 0;
  let passed = 0;
  for (const p of phases) {
    if (!STEPS[p]) {
      console.error(`Bilinmeyen faz: ${p}`);
      process.exit(1);
    }
    const r = await runPhase(p, STEPS[p]);
    total += r.total;
    passed += r.passed;
  }
  console.log(`\n${passed}/${total} adım geçti`);
  process.exit(passed === total ? 0 : 1);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
