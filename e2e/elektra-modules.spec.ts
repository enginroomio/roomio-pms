import { test, expect } from '@playwright/test';
import {
  ACCOUNTING_EMAIL,
  ADMIN_EMAIL,
  DEMO_PASSWORD,
  authHeaders,
  loginApiTokenWith,
} from './helpers/api-auth';

function bookingDates() {
  const checkIn = new Date();
  checkIn.setDate(checkIn.getDate() + 7);
  const checkOut = new Date(checkIn);
  checkOut.setDate(checkOut.getDate() + 2);
  return {
    checkIn: checkIn.toISOString().slice(0, 10),
    checkOut: checkOut.toISOString().slice(0, 10),
  };
}

test.describe('Elektra modülleri — herkese açık API', () => {
  test('booking availability', async ({ request }) => {
    const { checkIn, checkOut } = bookingDates();
    const res = await request.get(
      `/api/booking/availability?checkIn=${checkIn}&checkOut=${checkOut}`,
    );
    expect(res.ok()).toBeTruthy();
    const body = (await res.json()) as { ok: boolean; days: unknown[]; hotelName?: string };
    expect(body.ok).toBe(true);
    expect(body.days.length).toBeGreaterThan(0);
    expect(body.hotelName).toBeTruthy();
  });

  test('booking reserve → guest portal → check-in', async ({ request }) => {
    const { checkIn, checkOut } = bookingDates();
    const email = `e2e-${Date.now()}@roomio.test`;

    const reserve = await request.post('/api/booking/reserve', {
      data: {
        guestName: 'E2E Online Misafir',
        email,
        phone: '+905551112233',
        checkIn,
        checkOut,
        roomType: 'DBL',
        adults: 2,
        paymentMethod: 'hotel',
      },
    });
    expect(reserve.ok()).toBeTruthy();
    const booked = (await reserve.json()) as {
      ok: boolean;
      refNo?: string;
      guestPortalToken?: string;
      reservationId?: string;
    };
    expect(booked.ok).toBe(true);
    expect(booked.refNo).toBeTruthy();
    expect(booked.guestPortalToken).toBeTruthy();

    const session = await request.post('/api/guest-portal/session', {
      data: { token: booked.guestPortalToken },
    });
    expect(session.ok()).toBeTruthy();
    const sess = (await session.json()) as {
      ok: boolean;
      reservation?: { refNo: string; guestName: string };
      features?: { allowOnlineCheckIn?: boolean };
    };
    expect(sess.ok).toBe(true);
    expect(sess.reservation?.refNo).toBe(booked.refNo);

    if (sess.features?.allowOnlineCheckIn) {
      const checkInRes = await request.post('/api/guest-portal/check-in', {
        data: { token: booked.guestPortalToken },
      });
      expect(checkInRes.ok()).toBeTruthy();
      const ci = (await checkInRes.json()) as { ok: boolean };
      expect(ci.ok).toBe(true);
    }
  });

  test('guest portal refNo + email lookup', async ({ request }) => {
    const { checkIn, checkOut } = bookingDates();
    const email = `lookup-${Date.now()}@roomio.test`;
    const reserve = await request.post('/api/booking/reserve', {
      data: {
        guestName: 'Lookup Test',
        email,
        checkIn,
        checkOut,
        roomType: 'SGL',
        adults: 1,
      },
    });
    const booked = (await reserve.json()) as { refNo?: string };
    const session = await request.post('/api/guest-portal/session', {
      data: { refNo: booked.refNo, email },
    });
    expect(session.ok()).toBeTruthy();
  });

  test('digital menu, kiosk info, spa catalog — public', async ({ request }) => {
    const menu = await request.get('/api/integrations/digital-menu/menu');
    expect(menu.ok()).toBeTruthy();
    const menuBody = (await menu.json()) as { hotelName?: string; categories?: Record<string, unknown[]> };
    expect(menuBody.hotelName).toBeTruthy();

    const kiosk = await request.get('/api/kiosk/info');
    expect(kiosk.ok()).toBeTruthy();

    const spa = await request.get('/api/spa/catalog');
    expect(spa.ok()).toBeTruthy();
    const spaBody = (await spa.json()) as { treatments?: unknown[] };
    expect(Array.isArray(spaBody.treatments)).toBe(true);
  });

  test('viofun, marina, guest app, ai chat — public', async ({ request }) => {
    const viofun = await request.get('/api/integrations/viofun/catalog');
    expect(viofun.ok()).toBeTruthy();

    const marina = await request.get('/api/integrations/marina/catalog');
    expect(marina.ok()).toBeTruthy();

    const app = await request.get('/api/integrations/guest-app/info');
    expect(app.ok()).toBeTruthy();
    const appBody = (await app.json()) as { appName?: string };
    expect(appBody.appName).toBeTruthy();

    const chat = await request.post('/api/integrations/ai-assistant/chat', {
      data: { message: 'SPA rezervasyonu nasıl yapılır?' },
    });
    expect(chat.ok()).toBeTruthy();
    const chatBody = (await chat.json()) as { ok: boolean; reply: string };
    expect(chatBody.ok).toBe(true);
    expect(chatBody.reply.length).toBeGreaterThan(0);
  });

  test('restaurant, carbon, lite mobile — public', async ({ request }) => {
    expect((await request.get('/api/integrations/restaurant-booking/catalog')).ok()).toBeTruthy();
    expect((await request.get('/api/integrations/carbon/info')).ok()).toBeTruthy();
    expect((await request.get('/api/integrations/lite-mobile/info')).ok()).toBeTruthy();
    const quote = await request.post('/api/integrations/carbon/quote', { data: { nights: 2 } });
    expect(quote.ok()).toBeTruthy();
  });

  test('hr portal + inventory — public', async ({ request }) => {
    const hr = await request.get('/api/integrations/hr-portal/info');
    expect(hr.ok()).toBeTruthy();
    const hrBody = (await hr.json()) as { appName?: string };
    expect(hrBody.appName).toBeTruthy();

    const inv = await request.get('/api/integrations/inventory/summary');
    expect(inv.ok()).toBeTruthy();
    const invBody = (await inv.json()) as { itemCount?: number };
    expect(typeof invBody.itemCount).toBe('number');
  });
});

test.describe('Elektra modülleri — admin API', () => {
  test('integrations status — yeni modüller', async ({ request }) => {
    const token = await loginApiTokenWith(request, ADMIN_EMAIL, DEMO_PASSWORD);
    const res = await request.get('/api/integrations/status', { headers: authHeaders(token) });
    expect(res.ok()).toBeTruthy();
    const body = (await res.json()) as {
      bookingEngine?: { enabled: boolean };
      dynamicPricing?: { enabled: boolean };
      guestPortal?: { enabled: boolean };
      efatura?: { enabled: boolean };
      channelManager?: { enabled: boolean };
      whatsapp?: { enabled: boolean };
      loyalty?: { enabled: boolean };
      digitalMenu?: { enabled: boolean };
      reputation?: { enabled: boolean };
      banking?: { enabled: boolean };
      callCenter?: { enabled: boolean };
      kiosk?: { enabled: boolean };
      spa?: { enabled: boolean };
      tourOperator?: { enabled: boolean };
      viofun?: { enabled: boolean };
      guestApp?: { enabled: boolean };
      aiAssistant?: { enabled: boolean };
      marina?: { enabled: boolean };
      hrPortal?: { enabled: boolean };
      supplierPortal?: { enabled: boolean };
      inventory?: { enabled: boolean };
      restaurantBooking?: { enabled: boolean };
      virtualPos?: { enabled: boolean };
      liteMobile?: { enabled: boolean };
      quality?: { enabled: boolean };
      carbon?: { enabled: boolean };
      fairEvents?: { enabled: boolean };
      googleBackup?: { enabled: boolean };
      fixedAssets?: { enabled: boolean };
      procurement?: { enabled: boolean };
      websiteBuilder?: { enabled: boolean };
      gym?: { enabled: boolean };
      eDispatch?: { enabled: boolean };
      idReader?: { enabled: boolean };
    };
    expect(body.bookingEngine).toBeTruthy();
    expect(body.dynamicPricing).toBeTruthy();
    expect(body.guestPortal).toBeTruthy();
    expect(body.efatura).toBeTruthy();
    expect(body.channelManager).toBeTruthy();
    expect(body.whatsapp).toBeTruthy();
    expect(body.loyalty).toBeTruthy();
    expect(body.digitalMenu).toBeTruthy();
    expect(body.reputation).toBeTruthy();
    expect(body.banking).toBeTruthy();
    expect(body.callCenter).toBeTruthy();
    expect(body.kiosk).toBeTruthy();
    expect(body.spa).toBeTruthy();
    expect(body.tourOperator).toBeTruthy();
    expect(body.viofun).toBeTruthy();
    expect(body.guestApp).toBeTruthy();
    expect(body.aiAssistant).toBeTruthy();
    expect(body.marina).toBeTruthy();
    expect(body.hrPortal).toBeTruthy();
    expect(body.supplierPortal).toBeTruthy();
    expect(body.inventory).toBeTruthy();
    expect(body.restaurantBooking).toBeTruthy();
    expect(body.virtualPos).toBeTruthy();
    expect(body.liteMobile).toBeTruthy();
    expect(body.quality).toBeTruthy();
    expect(body.carbon).toBeTruthy();
    expect(body.fairEvents).toBeTruthy();
    expect(body.googleBackup).toBeTruthy();
    expect(body.fixedAssets).toBeTruthy();
    expect(body.procurement).toBeTruthy();
    expect(body.websiteBuilder).toBeTruthy();
    expect(body.gym).toBeTruthy();
    expect(body.eDispatch).toBeTruthy();
    expect(body.idReader).toBeTruthy();
  });

  test('yeni modüller — admin aksiyonlar', async ({ request }) => {
    const token = await loginApiTokenWith(request, ADMIN_EMAIL, DEMO_PASSWORD);
    const headers = authHeaders(token);

    const hrTest = await request.post('/api/integrations/hr-portal/config?test=1', { headers });
    expect(hrTest.ok()).toBeTruthy();
    const hrBody = (await hrTest.json()) as { ok: boolean; message: string };
    expect(hrBody.ok).toBe(true);

    const invSync = await request.post('/api/integrations/inventory/sync', { headers });
    expect(invSync.ok()).toBeTruthy();

    const order = await request.post('/api/integrations/supplier-portal/order', {
      headers,
      data: { supplierId: 's1', item: 'Deterjan', quantity: 10 },
    });
    expect(order.ok()).toBeTruthy();
    const orderBody = (await order.json()) as { ok: boolean; orderId?: string };
    expect(orderBody.ok).toBe(true);
    expect(orderBody.orderId).toBeTruthy();

    await request.post('/api/integrations/virtual-pos/config', {
      headers,
      data: {
        enabled: true,
        provider: 'iyzico',
        merchantId: 'e2e',
        apiKey: 'e2e',
        secretKey: 'e2e',
        threeDSecure: true,
        installmentEnabled: true,
        currencies: ['TRY', 'EUR', 'USD'],
        simulateWhenOffline: true,
      },
    });

    const vposTest = await request.post('/api/integrations/virtual-pos/config?test=1', { headers });
    expect(vposTest.ok()).toBeTruthy();
    const vposBody = (await vposTest.json()) as { ok: boolean; message: string };
    expect(vposBody.ok).toBe(true);

    const charge = await request.post('/api/integrations/virtual-pos/charge', {
      headers,
      data: { amount: 250, currency: 'TRY', refNo: 'e2e-vpos' },
    });
    expect(charge.ok()).toBeTruthy();
    const chargeBody = (await charge.json()) as { ok: boolean; transactionId?: string };
    expect(chargeBody.ok).toBe(true);
    expect(chargeBody.transactionId).toBeTruthy();

    const audit = await request.post('/api/integrations/quality/audit', { headers });
    expect(audit.ok()).toBeTruthy();
    const auditBody = (await audit.json()) as { ok: boolean; message: string };
    expect(auditBody.ok).toBe(true);
    expect(auditBody.message).toBeTruthy();
  });

  test('kanal yöneticisi senkron', async ({ request }) => {
    const token = await loginApiTokenWith(request, ADMIN_EMAIL, DEMO_PASSWORD);
    const headers = authHeaders(token);

    await request.post('/api/integrations/channel-manager/config', {
      headers,
      data: {
        enabled: true,
        simulateWhenOffline: true,
        autoConfirmReservations: true,
        compareOfflineRates: true,
        syncIntervalMinutes: 15,
        virtualRoomMappings: [
          { pmsRoomTypeId: 'STD', pmsRoomTypeName: 'Standart', channelRoomTypeId: 'STD-V', channelRoomTypeName: 'Standart (Sanal)' },
        ],
        channels: [
          {
            channelId: 'booking',
            enabled: true,
            propertyId: '1234567',
            apiKey: 'test-key-ota',
            pushRates: true,
            pushAvailability: true,
            pullReservations: true,
          },
        ],
      },
    });

    const res = await request.post('/api/integrations/channel-manager/sync', { headers });
    expect(res.ok()).toBeTruthy();
    const body = (await res.json()) as {
      ok: boolean;
      message: string;
      pulledReservations?: number;
      importedReservations?: number;
      logId?: string;
    };
    expect(body.message).toBeTruthy();
    expect(body.ok).toBe(true);
    expect(body.logId).toBeTruthy();

    const logs = await request.get('/api/integrations/channel-manager/logs?limit=3', { headers });
    expect(logs.ok()).toBeTruthy();
    const logBody = (await logs.json()) as { logs: Array<{ id: string }> };
    expect(logBody.logs.length).toBeGreaterThan(0);
  });

  test('dinamik fiyatlandırma uygula', async ({ request }) => {
    const token = await loginApiTokenWith(request, ADMIN_EMAIL, DEMO_PASSWORD);
    const res = await request.post('/api/integrations/dynamic-pricing/apply', {
      headers: authHeaders(token),
    });
    expect(res.ok()).toBeTruthy();
    const body = (await res.json()) as { ok: boolean; updatedCells: number };
    expect(body.ok).toBe(true);
    expect(body.updatedCells).toBeGreaterThanOrEqual(0);
  });

  test('e-Fatura test ve fatura gönderimi', async ({ request }) => {
    const adminToken = await loginApiTokenWith(request, ADMIN_EMAIL, DEMO_PASSWORD);
    const accountingToken = await loginApiTokenWith(request, ACCOUNTING_EMAIL, DEMO_PASSWORD);

    await request.post('/api/integrations/efatura/config', {
      headers: authHeaders(adminToken),
      data: {
        enabled: true,
        environment: 'test',
        integrator: 'roomio-e2e',
        username: 'e2e',
        password: 'e2e',
        vkn: '1234567890',
        alias: 'urn:mail:e2e@efatura.gov.tr',
        autoSendOnIssue: false,
        sendEArchive: true,
        sendEDispatch: false,
        simulateWhenOffline: true,
      },
    });

    const testRes = await request.post('/api/integrations/efatura/config?test=1', {
      headers: authHeaders(adminToken),
    });
    expect(testRes.ok()).toBeTruthy();

    const inv = await request.post('/api/accounting/invoices', {
      headers: authHeaders(accountingToken),
      data: { guest: 'E2E e-Fatura', amount: 1500, vat: 20, type: 'konaklama' },
    });
    expect(inv.ok()).toBeTruthy();
    const invBody = (await inv.json()) as { invoice?: { id: string } };
    expect(invBody.invoice?.id).toBeTruthy();

    const send = await request.post('/api/integrations/efatura/send', {
      headers: authHeaders(accountingToken),
      data: { invoiceId: invBody.invoice!.id },
    });
    expect(send.ok()).toBeTruthy();
    const sent = (await send.json()) as { ok: boolean; submission?: { status: string } };
    expect(sent.ok).toBe(true);
    expect(sent.submission?.status).toBe('sent');
  });
});

test.describe('Elektra modülleri — UI', () => {
  test('/book sayfası', async ({ page }) => {
    await page.goto('/book');
    await expect(page.getByRole('button', { name: /Rezervasyonu Tamamla/i })).toBeVisible({ timeout: 15_000 });
    await expect(page.getByText(/Online Rezervasyon|Doğrudan rezervasyon/i).first()).toBeVisible();
  });

  test('/guest sayfası', async ({ page }) => {
    await page.goto('/guest');
    await expect(page.getByText(/Misafir Self-Servis|Portal token/i).first()).toBeVisible({ timeout: 15_000 });
    await expect(page.getByRole('button', { name: /Giriş Yap/i })).toBeVisible();
    await expect(page.getByText('Otel hizmetleri')).toBeVisible();
    await expect(page.getByRole('link', { name: 'Restoran rezervasyonu' })).toBeVisible();
    await expect(page.getByRole('link', { name: 'Spor salonu' })).toBeVisible();
  });

  test('/menu sayfası', async ({ page }) => {
    await page.goto('/menu');
    await expect(page.getByText(/Dijital Menü|QR masa menüsü/i).first()).toBeVisible({ timeout: 15_000 });
  });

  test('/kiosk sayfası', async ({ page }) => {
    await page.goto('/kiosk');
    await expect(page.getByText(/Self Check-in Kiosk|Check-in Kiosk/i).first()).toBeVisible({ timeout: 15_000 });
  });

  test('/spa sayfası', async ({ page }) => {
    await page.goto('/spa');
    await expect(page.getByText(/SPA|Wellness/i).first()).toBeVisible({ timeout: 15_000 });
  });

  test('/viofun sayfası', async ({ page }) => {
    await page.goto('/viofun');
    await expect(page.getByText(/Viofun|aktivite/i).first()).toBeVisible({ timeout: 15_000 });
  });

  test('/marina sayfası', async ({ page }) => {
    await page.goto('/marina');
    await expect(page.getByText(/Marina|Rıhtım/i).first()).toBeVisible({ timeout: 15_000 });
  });

  test('/app ve /ask sayfaları', async ({ page }) => {
    await page.goto('/app');
    await expect(page.getByText(/Misafir|Roomio Guest/i).first()).toBeVisible({ timeout: 15_000 });
    await page.goto('/ask');
    await expect(page.getByText(/AI Asistan|Otel AI/i).first()).toBeVisible({ timeout: 15_000 });
  });

  test('/restaurant, /carbon, /staff ve /hr sayfaları', async ({ page }) => {
    await page.goto('/restaurant');
    await expect(page.locator('.roomio-public-portal__brand strong')).toBeVisible({ timeout: 15_000 });
    await page.goto('/carbon');
    await expect(page.locator('.roomio-public-portal__brand strong')).toBeVisible({ timeout: 15_000 });
    await page.goto('/staff');
    await expect(page.getByText(/Personel mobil uygulaması|Lite Mobile/i).first()).toBeVisible({ timeout: 15_000 });
    await page.goto('/hr');
    await expect(page.getByText(/Personel self-servis|IK Mobil/i).first()).toBeVisible({ timeout: 15_000 });
  });

  test('/fair, /gym ve /hotel sayfaları', async ({ page }) => {
    await page.goto('/fair');
    await expect(page.getByText(/Fuar|Etkinlik|Online kayıt/i).first()).toBeVisible({ timeout: 15_000 });
    await page.goto('/gym');
    await expect(page.getByText(/Fitness|Spor dersleri/i).first()).toBeVisible({ timeout: 15_000 });
    await page.goto('/hotel');
    await expect(page.getByText(/Roomio Hotel|Otel web sitesi|Online rezervasyon/i).first()).toBeVisible({ timeout: 15_000 });
  });

  test('entegrasyon hub — yeni kartlar', async ({ page }) => {
    await page.goto('/settings/integrations');
    await expect(page.getByRole('heading', { name: 'Online Rezervasyon Motoru' })).toBeVisible({ timeout: 15_000 });
    const headings = [
      'Kanal Yöneticisi',
      'Dinamik Fiyatlandırma',
      'Misafir Portalı',
      /e-Fatura/i,
      'WhatsApp API',
      'Check-in Kiosk',
      /Sadakat/i,
      'SPA Yönetimi',
      'Tur Operatörü',
      'Viofun',
      /Misafir Uygulaması/i,
      /AI Asistan/i,
      /Marina/i,
      'IK Portal',
      'Tedarik Portalı',
      'Stok Takip',
      'Restoran Online Rezervasyon',
      'Sanal POS',
      'Lite Mobile',
      'Kalite Yönetimi',
      'Karbon Dengeleme',
      'Fuar Otomasyon',
      'Spor Salonu',
      'Web Sitesi',
    ] as const;
    for (const name of headings) {
      const heading = page.getByRole('heading', { name, exact: typeof name === 'string' });
      await expect(heading.first()).toBeVisible({ timeout: 10_000 });
    }
  });
});
