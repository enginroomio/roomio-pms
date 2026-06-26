#!/usr/bin/env node
/**
 * Çekirdek PMS akışı — rezervasyon → check-in → folyo → check-out
 * Kullanım: ROOMIO_URL=http://127.0.0.1:3100 npm run test:core-flow
 */
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

function readActivePort() {
  try {
    const port = readFileSync(join(process.cwd(), '.roomio/runtime/active-port.txt'), 'utf8').trim();
    return port ? `http://127.0.0.1:${port}` : null;
  } catch {
    return null;
  }
}

async function resolveBaseUrl() {
  const candidates = [process.env.ROOMIO_URL, readActivePort(), 'http://127.0.0.1:3100'].filter(Boolean);
  for (const base of candidates) {
    try {
      const res = await fetch(`${base}/api/health`, { signal: AbortSignal.timeout(8000) });
      if (res.ok) return base;
    } catch {
      // try next
    }
  }
  return candidates[0] ?? 'http://127.0.0.1:3100';
}

const BASE = await resolveBaseUrl();
const TIMEOUT = Number(process.env.CORE_FLOW_TIMEOUT_MS ?? 45_000);

async function api(path, init = {}) {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), TIMEOUT);
  try {
    const res = await fetch(`${BASE}${path}`, { ...init, signal: ctrl.signal });
    const json = await res.json().catch(() => ({}));
    return { res, json };
  } finally {
    clearTimeout(timer);
  }
}

function assertStep(name, ok, detail = '') {
  const mark = ok ? '✓' : '✗';
  console.log(`${mark} ${name}${detail ? ` — ${detail}` : ''}`);
  return ok;
}

async function main() {
  console.log(`Çekirdek PMS akışı → ${BASE}\n`);

  const health = await api('/api/health');
  if (!assertStep('Sunucu sağlık', health.res.ok)) process.exit(1);

  const today = new Date();
  const checkIn = new Date(today);
  checkIn.setDate(checkIn.getDate() + 14);
  const checkOut = new Date(checkIn);
  checkOut.setDate(checkOut.getDate() + 2);
  const checkInStr = checkIn.toISOString().slice(0, 10);
  const checkOutStr = checkOut.toISOString().slice(0, 10);
  const guestName = `Test Misafir ${Date.now()}`;

  const create = await api('/api/reservations', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      guestName,
      checkIn: checkInStr,
      checkOut: checkOutStr,
      roomType: 'DBL',
      status: 'CONFIRMED',
      agency: 'DIRECT',
      market: 'FIT',
      rate: 1200,
      adults: 2,
    }),
  });
  const reservation = create.json.reservation;
  if (!assertStep('Rezervasyon oluştur', create.res.ok && reservation?.id, create.json.error ?? '')) {
    process.exit(1);
  }

  const roomNo = '901';
  const checkInReq = await api('/api/reception/check-in', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      reservationId: reservation.id,
      roomNo,
      guestName,
      checkIn: checkInStr,
      checkOut: checkOutStr,
      reservationRef: reservation.refNo ?? reservation.id,
      tesa: false,
      hotspot: false,
      pbx: false,
    }),
  });
  if (!assertStep('Check-in', checkInReq.res.ok && checkInReq.json.ok !== false, checkInReq.json.message ?? '')) {
    process.exit(1);
  }

  const charge = await api('/api/folio', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      action: 'charge',
      reservationId: reservation.id,
      amount: 150,
      description: 'Minibar test',
    }),
  });
  if (!assertStep('Folyo tahakkuk', charge.res.ok, charge.json.error ?? charge.json.message ?? '')) {
    process.exit(1);
  }

  const payment = await api('/api/folio', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      action: 'payment',
      reservationId: reservation.id,
      amount: 150,
      description: 'Nakit test',
    }),
  });
  if (!assertStep('Folyo tahsilat', payment.res.ok, payment.json.error ?? payment.json.message ?? '')) {
    process.exit(1);
  }

  const folio = await api(`/api/folio?reservationId=${reservation.id}`);
  const balance = folio.json.balance ?? folio.json.lines?.reduce?.(
    (s, l) => s + (l.type === 'payment' ? -l.amount : l.amount),
    0,
  );
  if (!assertStep('Folyo bakiye oku', folio.res.ok, `bakiye: ${balance ?? '?'}`)) {
    process.exit(1);
  }

  const checkout = await api('/api/reception/checkout', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      reservationId: reservation.id,
      roomNo,
      guestName,
      pbx: false,
    }),
  });
  if (!assertStep('Check-out', checkout.res.ok && checkout.json.ok !== false, checkout.json.message ?? '')) {
    process.exit(1);
  }

  const updated = await api(`/api/reservations?id=${reservation.id}`);
  const status = updated.json.reservation?.status;
  if (!assertStep('Rezervasyon durumu', updated.res.ok && status === 'CHECKED_OUT', status ?? '')) {
    process.exit(1);
  }

  console.log('\n✓ Çekirdek PMS akışı tamamlandı\n');
}

main().catch((e) => {
  console.error('✗ Akış hatası:', e instanceof Error ? e.message : e);
  process.exit(1);
});
