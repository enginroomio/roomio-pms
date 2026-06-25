#!/usr/bin/env node
/**
 * ElektraWeb uyumlu modül smoke testleri (simülasyon modu).
 * Kullanım: ROOMIO_URL=http://127.0.0.1:3100 npm run test:elektra-modules
 */
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

const ADMIN_EMAIL = process.env.ROOMIO_ADMIN_EMAIL ?? 'admin@roomio.local';
const ADMIN_PASSWORD = process.env.ROOMIO_CHECKLIST_PASSWORD ?? 'roomio123';
const ACCOUNTING_EMAIL = process.env.ROOMIO_ACCOUNTING_EMAIL ?? 'muhasebe@hotelsapphire.com';

function readActivePort() {
  try {
    const port = readFileSync(join(process.cwd(), '.roomio/runtime/active-port.txt'), 'utf8').trim();
    return port ? `http://127.0.0.1:${port}` : null;
  } catch {
    return null;
  }
}

async function resolveBaseUrl() {
  const candidates = [
    process.env.ROOMIO_URL,
    readActivePort(),
    'http://127.0.0.1:3100',
  ].filter(Boolean);
  for (const base of candidates) {
    try {
      const res = await fetch(`${base}/api/health`, { signal: AbortSignal.timeout(5000) });
      if (res.ok) return base;
    } catch {
      // try next candidate
    }
  }
  return candidates[0] ?? 'http://127.0.0.1:3100';
}

const BASE = await resolveBaseUrl();
const FETCH_TIMEOUT_MS = Number(process.env.ELEKTRA_TEST_TIMEOUT_MS ?? 60_000);

function dates() {
  const checkIn = new Date();
  checkIn.setDate(checkIn.getDate() + 10);
  const checkOut = new Date(checkIn);
  checkOut.setDate(checkOut.getDate() + 2);
  return {
    checkIn: checkIn.toISOString().slice(0, 10),
    checkOut: checkOut.toISOString().slice(0, 10),
  };
}

async function json(method, path, body, token) {
  const headers = body ? { 'Content-Type': 'application/json' } : {};
  if (token) headers.Authorization = `Bearer ${token}`;
  const res = await fetch(`${BASE}${path}`, {
    method,
    headers: Object.keys(headers).length ? headers : undefined,
    body: body ? JSON.stringify(body) : undefined,
    signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
  });
  const data = await res.json().catch(() => ({}));
  return { ok: res.ok, status: res.status, data };
}

async function fetchOk(path) {
  const res = await fetch(`${BASE}${path}`, { signal: AbortSignal.timeout(FETCH_TIMEOUT_MS) });
  return res.ok;
}

const tokens = {};
async function tokenAs(email) {
  if (!tokens[email]) {
    const login = await json('POST', '/api/auth/login', { email, password: ADMIN_PASSWORD });
    if (!login.ok || !login.data.token) throw new Error(`login failed ${email}`);
    tokens[email] = login.data.token;
  }
  return tokens[email];
}

async function adminJson(method, path, body) {
  return json(method, path, body, await tokenAs(ADMIN_EMAIL));
}

const { checkIn, checkOut } = dates();

const tests = [
  {
    name: 'public /book page',
    run: async () => fetchOk('/book'),
  },
  {
    name: 'public /guest page',
    run: async () => fetchOk('/guest'),
  },
  {
    name: 'booking availability',
    run: async () => {
      const r = await json('GET', `/api/booking/availability?checkIn=${checkIn}&checkOut=${checkOut}`);
      return r.ok && r.data.ok && Array.isArray(r.data.days) && r.data.days.length > 0;
    },
  },
  {
    name: 'booking reserve + guest token',
    run: async () => {
      const email = `smoke-${Date.now()}@roomio.test`;
      const r = await json('POST', '/api/booking/reserve', {
        guestName: 'Smoke Test',
        email,
        checkIn,
        checkOut,
        roomType: 'DBL',
        adults: 2,
      });
      return r.ok && r.data.ok && r.data.guestPortalToken && r.data.refNo;
    },
  },
  {
    name: 'public /menu page',
    run: async () => fetchOk('/menu'),
  },
  {
    name: 'public /kiosk page',
    run: async () => fetchOk('/kiosk'),
  },
  {
    name: 'public /spa page',
    run: async () => fetchOk('/spa'),
  },
  {
    name: 'digital menu API',
    run: async () => {
      const r = await json('GET', '/api/integrations/digital-menu/menu');
      return r.ok && r.data.hotelName;
    },
  },
  {
    name: 'spa catalog API',
    run: async () => {
      const r = await json('GET', '/api/spa/catalog');
      return r.ok && Array.isArray(r.data.treatments);
    },
  },
  {
    name: 'integrations status — all elektra modules',
    run: async () => {
      const r = await adminJson('GET', '/api/integrations/status');
      return (
        r.ok
        && r.data.bookingEngine
        && r.data.channelManager
        && r.data.dynamicPricing
        && r.data.guestPortal
        && r.data.efatura
        && r.data.whatsapp
        && r.data.loyalty
        && r.data.digitalMenu
        && r.data.reputation
        && r.data.banking
        && r.data.callCenter
        && r.data.kiosk
        && r.data.spa
        && r.data.tourOperator
        && r.data.viofun
        && r.data.guestApp
        && r.data.aiAssistant
        && r.data.marina
        && r.data.hrPortal
        && r.data.supplierPortal
        && r.data.inventory
        && r.data.restaurantBooking
        && r.data.virtualPos
        && r.data.liteMobile
        && r.data.quality
        && r.data.carbon
        && r.data.fairEvents
        && r.data.googleBackup
        && r.data.fixedAssets
        && r.data.procurement
        && r.data.websiteBuilder
        && r.data.gym
        && r.data.eDispatch
        && r.data.idReader
      );
    },
  },
  {
    name: 'fair register + gym book + hotel preview',
    run: async () => {
      const catalog = await json('GET', '/api/integrations/fair-events/catalog');
      if (!catalog.ok || !catalog.data.events?.[0]) return false;
      const reg = await json('POST', '/api/integrations/fair-events/register', {
        eventId: catalog.data.events[0].id,
        name: 'Smoke Fair',
        company: 'Roomio',
        email: `fair-${Date.now()}@roomio.test`,
      });
      const gym = await json('GET', '/api/integrations/gym/catalog');
      if (!gym.ok || !gym.data.classes?.[0]) return false;
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      const gymBook = await json('POST', '/api/integrations/gym/book', {
        classId: gym.data.classes[0].id,
        guest: 'Smoke Guest',
        roomNo: '101',
        date: tomorrow.toISOString().slice(0, 10),
      });
      const hotel = await json('GET', '/api/integrations/website-builder/preview');
      return reg.ok && reg.data.ok && gymBook.ok && gymBook.data.ok && hotel.ok && hotel.data.siteName;
    },
  },
  {
    name: 'hr portal + inventory — public',
    run: async () => {
      const hr = await json('GET', '/api/integrations/hr-portal/info');
      const inv = await json('GET', '/api/integrations/inventory/summary');
      return hr.ok && inv.ok && typeof hr.data.appName === 'string' && typeof inv.data.itemCount === 'number';
    },
  },
  {
    name: 'restaurant book + carbon quote',
    run: async () => {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      const date = tomorrow.toISOString().slice(0, 10);
      const book = await json('POST', '/api/integrations/restaurant-booking/book', {
        guest: 'Smoke Test',
        roomNo: '101',
        date,
        time: '20:00',
        party: 2,
      });
      const quote = await json('POST', '/api/integrations/carbon/quote', { nights: 3 });
      return book.ok && quote.ok && quote.data.offsetCost > 0;
    },
  },
  {
    name: 'yeni modüller — admin aksiyonlar',
    run: async () => {
      const hrTest = await adminJson('POST', '/api/integrations/hr-portal/config?test=1');
      const invSync = await adminJson('POST', '/api/integrations/inventory/sync');
      const order = await adminJson('POST', '/api/integrations/supplier-portal/order', {
        supplierId: 's1',
        item: 'Deterjan',
        quantity: 10,
      });
      await adminJson('POST', '/api/integrations/virtual-pos/config', {
        enabled: true,
        provider: 'iyzico',
        merchantId: 'smoke',
        apiKey: 'smoke',
        secretKey: 'smoke',
        threeDSecure: true,
        installmentEnabled: true,
        currencies: ['TRY', 'EUR', 'USD'],
        simulateWhenOffline: true,
      });
      const vposTest = await adminJson('POST', '/api/integrations/virtual-pos/config?test=1');
      const charge = await adminJson('POST', '/api/integrations/virtual-pos/charge', {
        amount: 100,
        currency: 'TRY',
        refNo: 'smoke-001',
      });
      const audit = await adminJson('POST', '/api/integrations/quality/audit');
      return (
        hrTest.ok
        && hrTest.data.ok
        && invSync.ok
        && order.ok
        && order.data.orderId
        && vposTest.ok
        && vposTest.data.ok
        && charge.ok
        && charge.data.ok
        && charge.data.transactionId
        && audit.ok
        && audit.data.ok
      );
    },
  },
  {
    name: 'tour operator sync',
    run: async () => {
      const r = await adminJson('POST', '/api/integrations/tour-operator/sync');
      return r.ok && typeof r.data.message === 'string';
    },
  },
  {
    name: 'ai assistant chat',
    run: async () => {
      const r = await json('POST', '/api/integrations/ai-assistant/chat', { message: 'check-in nasıl yapılır?' });
      return r.ok && r.data.ok && r.data.reply;
    },
  },
  {
    name: 'public viofun + marina + guest app',
    run: async () => {
      const vf = await json('GET', '/api/integrations/viofun/catalog');
      const mar = await json('GET', '/api/integrations/marina/catalog');
      const app = await json('GET', '/api/integrations/guest-app/info');
      return vf.ok && mar.ok && app.ok && app.data.appName;
    },
  },
  {
    name: 'reputation sync',
    run: async () => {
      const r = await adminJson('POST', '/api/integrations/reputation/sync');
      return r.ok && typeof r.data.message === 'string';
    },
  },
  {
    name: 'banking sync',
    run: async () => {
      const r = await adminJson('POST', '/api/integrations/banking/sync');
      return r.ok && typeof r.data.message === 'string';
    },
  },
  {
    name: 'channel manager sync',
    run: async () => {
      const r = await adminJson('POST', '/api/integrations/channel-manager/sync');
      return r.ok && typeof r.data.message === 'string';
    },
  },
  {
    name: 'dynamic pricing apply',
    run: async () => {
      const r = await adminJson('POST', '/api/integrations/dynamic-pricing/apply');
      return r.ok && r.data.ok === true;
    },
  },
  {
    name: 'efatura test + send',
    run: async () => {
      await adminJson('POST', '/api/integrations/efatura/config', {
        enabled: true,
        environment: 'test',
        integrator: 'smoke',
        username: 'smoke',
        password: 'smoke',
        vkn: '1234567890',
        alias: 'urn:mail:smoke@test',
        autoSendOnIssue: false,
        sendEArchive: true,
        sendEDispatch: false,
        simulateWhenOffline: true,
      });
      const acct = await tokenAs(ACCOUNTING_EMAIL);
      const inv = await json('POST', '/api/accounting/invoices', {
        guest: 'Smoke e-Fatura',
        amount: 999,
        vat: 20,
      }, acct);
      if (!inv.ok || !inv.data.invoice?.id) return false;
      const send = await json('POST', '/api/integrations/efatura/send', {
        invoiceId: inv.data.invoice.id,
      }, acct);
      return send.ok && send.data.ok;
    },
  },
  {
    name: 'live-probe endpoint',
    run: async () => {
      const r = await adminJson('GET', '/api/integrations/live-probe');
      return r.ok && typeof r.data.live === 'boolean';
    },
  },
];

let passed = 0;
console.log(`Elektra modules smoke → ${BASE}\n`);

for (const test of tests) {
  try {
    const ok = await test.run();
    if (ok) {
      passed += 1;
      console.log(`✓ ${test.name}`);
    } else {
      console.log(`✗ ${test.name}`);
    }
  } catch (e) {
    console.log(`✗ ${test.name} — ${e instanceof Error ? e.message : 'error'}`);
  }
}

console.log(`\n${passed}/${tests.length} geçti`);
process.exit(passed === tests.length ? 0 : 1);
