import type { Page } from '@playwright/test';

export type DemoRole = 'admin' | 'fo_manager' | 'reception' | 'hk' | 'accounting' | 'viewer';

/** Demo mode picks role from localStorage when no JWT is stored. */
export async function useDemoRole(page: Page, role: DemoRole = 'admin') {
  await page.context().clearCookies();
  await page.addInitScript((r: string) => {
    localStorage.setItem('roomio-demo-role', r);
    localStorage.setItem('roomio-locale', 'tr');
    localStorage.removeItem('roomio-token');
  }, role);
}

/** Oturum API yanıtını tetikle (goto sonrası kullanım için). */
export async function waitForDemoSession(page: Page, role: DemoRole = 'admin') {
  await Promise.all([
    page.waitForResponse(
      (res) => res.url().includes('/api/auth/session') && res.ok(),
      { timeout: 15_000 },
    ),
    page.evaluate(
      (r) => fetch(`/api/auth/session?role=${r}`, { credentials: 'include' }),
      role,
    ),
  ]);
}

type GotoReadyWhen = 'heading' | 'list' | 'main';

async function waitForDemoPageReady(page: Page, readyWhen: GotoReadyWhen) {
  const timeout = 90_000;
  if (readyWhen === 'list') {
    await page
      .waitForResponse((res) => res.url().includes('/api/reservations') && res.ok(), { timeout })
      .catch(() => undefined);
    const loading = page.getByText(/Rezervasyonlar yükleniyor/i);
    if (await loading.isVisible().catch(() => false)) {
      await loading.waitFor({ state: 'hidden', timeout });
    }
    await page.getByRole('button', { name: 'Filtreler' }).waitFor({ state: 'visible', timeout: 45_000 });
    return;
  }
  if (readyWhen === 'main') {
    await page.locator('main, .roomio-page-stack').first().waitFor({ state: 'visible', timeout });
    return;
  }
  await page.locator('h1.roomio-page-title, main h1').first().waitFor({ state: 'visible', timeout });
}

/** Demo rolü ayarla, sayfaya git; kabuk hazır olana kadar bekle. */
export async function gotoWithDemo(
  page: Page,
  url: string,
  role: DemoRole = 'admin',
  opts?: { waitForSideNav?: boolean; readyWhen?: GotoReadyWhen },
) {
  await useDemoRole(page, role);
  await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 120_000 });
  if (opts?.readyWhen) {
    await waitForDemoPageReady(page, opts.readyWhen);
    return;
  }
  if (opts?.waitForSideNav === false) {
    await waitForDemoPageReady(page, 'heading');
    return;
  }
  await page.locator('.roomio-module-side__link, .roomio-module-side__branch').first().waitFor({
    state: 'visible',
    timeout: 120_000,
  });
}

/** Demo rolü + ilk sayfa yüklemesi (hub testleri için). */
export async function bootstrapDemoPage(page: Page, role: DemoRole = 'admin', url = '/') {
  await gotoWithDemo(page, url, role);
}
