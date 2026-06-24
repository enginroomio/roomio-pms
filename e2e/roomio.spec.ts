import { test, expect } from '@playwright/test';
import { authedGet, authedPost, loginApiToken, authHeaders } from './helpers/api-auth';

test('ana sayfa yüklenir', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByRole('heading', { name: /Merhaba/i })).toBeVisible();
});

test('oda rack kat sekmeleri görünür', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByRole('button', { name: /Tüm rack/i })).toBeVisible();
  await expect(page.getByRole('button', { name: /1\. Kat/i })).toBeVisible();
  await expect(page.getByRole('button', { name: /5\. Kat/i })).toBeVisible();
});

test('oda rack tek kat filtresi', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: /1\. Kat/i }).click();
  await expect(page.getByRole('button', { name: '101' })).toBeVisible();
  await expect(page.getByRole('button', { name: '201' })).toHaveCount(0);
});

test('rack API', async ({ request }) => {
  const res = await authedGet(request, '/api/rack');
  expect(res.ok()).toBeTruthy();
  const j = await res.json() as { totalRooms: number; cells: unknown[] };
  expect(j.totalRooms).toBeGreaterThan(0);
  expect(j.cells.length).toBeGreaterThan(0);
});

test('dashboard API', async ({ request }) => {
  const res = await authedGet(request, '/api/dashboard');
  expect(res.ok()).toBeTruthy();
  const j = await res.json() as { ok?: boolean; totalRooms?: number; occupancy?: number };
  expect(j.ok ?? j.totalRooms != null).toBeTruthy();
});

test('rezervasyon listesi API', async ({ request }) => {
  const res = await authedGet(request, '/api/reservations');
  expect(res.ok()).toBeTruthy();
  const j = await res.json() as { count: number };
  expect(j.count).toBeGreaterThan(0);
});

test('muhasebe sayfası', async ({ page }) => {
  await page.goto('/accounting');
  await expect(page.getByText('Muhasebe & ArkaBüro')).toBeVisible();
});

test('PDF export', async ({ request }) => {
  const res = await request.get('/api/reports/export?format=pdf');
  expect(res.ok()).toBeTruthy();
  expect(res.headers()['content-type']).toContain('pdf');
});

test('housekeeping API', async ({ request }) => {
  const res = await request.get('/api/housekeeping/rooms');
  expect(res.ok()).toBeTruthy();
  const j = await res.json() as { count: number; rooms: Array<{ roomNo: string; status: string }> };
  expect(j.count).toBeGreaterThan(0);
  expect(j.rooms[0]?.roomNo).toBeTruthy();
  expect(j.rooms[0]?.status).toBeTruthy();
});

test('kat hizmetleri oda panosu', async ({ page }) => {
  await page.goto('/housekeeping/rooms');
  await expect(page.getByRole('heading', { name: /Oda Listesi/i })).toBeVisible();
  await expect(page.getByRole('table')).toBeVisible();
  await expect(page.getByText('Temiz')).toBeVisible();
});

test('housekeeping pano mockup', async ({ page }) => {
  await page.goto('/housekeeping');
  await expect(page.getByRole('heading', { name: /Housekeeping Pano/i })).toBeVisible();
  await expect(page.getByRole('button', { name: /Kat 1/i })).toBeVisible();
  await expect(page.getByText('Kat Görevlileri')).toBeVisible();
});

test('room rack F12 sayfası', async ({ page }) => {
  await page.goto('/rooms');
  await expect(page.getByRole('heading', { name: /Room Rack \(F12\)/i })).toBeVisible();
  await expect(page.getByText('Toplam Oda:')).toBeVisible();
});

test('rezervasyon listesi screen-039', async ({ page }) => {
  await page.goto('/reservations');
  await expect(page.getByRole('heading', { name: /Rezervasyon Listesi/i })).toBeVisible();
  await expect(page.getByText('Filtreler')).toBeVisible();
  await expect(page.getByText('Kayıt Sayısı:')).toBeVisible();
  await expect(page.getByText('F2')).toBeVisible();
});

test('rezervasyon grafikler F1', async ({ page }) => {
  await page.goto('/reservations/calendar');
  await expect(page.getByRole('heading', { name: /^Grafikler$/i })).toBeVisible();
  await expect(page.getByText('Otel doluluk özeti')).toBeVisible();
  await expect(page.getByRole('link', { name: 'Grafikler (F1)' })).toBeVisible();
  await expect(page.getByText('F1')).toBeVisible();
});

test('JWT login', async ({ request }) => {
  const token = await loginApiToken(request);
  expect(token).toBeTruthy();
  const res = await request.get('/api/dashboard', { headers: authHeaders(token) });
  expect(res.ok()).toBeTruthy();
});
