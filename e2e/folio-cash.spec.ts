import { test, expect } from '@playwright/test';
import { authedGet, authedPost } from './helpers/api-auth';

test.describe('Folyo API — harcama ve tahsilat', () => {
  test('charge artırır, payment azaltır', async ({ request }) => {
    const resList = await authedGet(request, '/api/reservations');
    expect(resList.ok()).toBeTruthy();
    const { reservations } = (await resList.json()) as {
      reservations: Array<{ id: string; status: string; guestName: string }>;
    };
    const inHouse = reservations.find((r) => r.status === 'CHECKED_IN');
    expect(inHouse).toBeTruthy();

    const before = await authedGet(request, `/api/folio?reservationId=${inHouse!.id}`);
    expect(before.ok()).toBeTruthy();
    const bj = (await before.json()) as { balance: number };
    const balanceBefore = bj.balance;

    const chargeAmt = 150;
    const charge = await authedPost(request, '/api/folio', {
      action: 'charge',
      reservationId: inHouse!.id,
      amount: chargeAmt,
      description: 'E2E Minibar test',
    });
    expect(charge.ok()).toBeTruthy();

    const afterCharge = await authedGet(request, `/api/folio?reservationId=${inHouse!.id}`);
    const ac = (await afterCharge.json()) as { balance: number };
    expect(ac.balance).toBeCloseTo(balanceBefore + chargeAmt, 1);

    const payAmt = 50;
    const payment = await authedPost(request, '/api/folio', {
      reservationId: inHouse!.id,
      amount: payAmt,
      description: 'E2E kısmi tahsilat',
    });
    expect(payment.ok()).toBeTruthy();

    const afterPay = await authedGet(request, `/api/folio?reservationId=${inHouse!.id}`);
    const ap = (await afterPay.json()) as { balance: number };
    expect(ap.balance).toBeCloseTo(balanceBefore + chargeAmt - payAmt, 1);
  });
});

test.describe('Folyo UI', () => {
  test('misafir folyo sayfası harcama formu', async ({ page, request }) => {
    const resList = await authedGet(request, '/api/reservations');
    const { reservations } = (await resList.json()) as {
      reservations: Array<{ id: string; status: string }>;
    };
    const inHouse = reservations.find((r) => r.status === 'CHECKED_IN');
    expect(inHouse).toBeTruthy();

    await page.goto(`/reception/guest/${inHouse!.id}?tab=folio`);
    await expect(page.getByRole('button', { name: /Harcama ekle/i })).toBeVisible();
    await expect(page.getByRole('button', { name: /Tahsilat/i })).toBeVisible();
  });
});

test.describe('Kasa API', () => {
  test('kasa devir kaydı oluşturur', async ({ request }) => {
    const res = await authedPost(request, '/api/cash', {
      action: 'transfer',
      fromRegister: 'Resepsiyon 1',
      toRegister: 'Ana Kasa',
      amount: 100,
      user: 'E2E',
    });
    expect(res.ok()).toBeTruthy();
    const j = (await res.json()) as { ok?: boolean; outEntry?: { type: string } };
    expect(j.ok).toBe(true);
    expect(j.outEntry?.type).toBe('odeme');
  });
});
