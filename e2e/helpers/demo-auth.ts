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

async function assertNotErrorPage(page: Page) {
  const is404 = await page
    .getByRole('heading', { name: '404' })
    .isVisible()
    .catch(() => false);
  if (is404) {
    throw new Error(`Sayfa 404 döndü: ${page.url()}`);
  }
}

async function waitForDemoPageReady(page: Page, readyWhen: GotoReadyWhen) {
  const timeout = 75_000;
  if (readyWhen === 'list') {
    void page
      .waitForResponse((res) => res.url().includes('/api/reservations') && res.ok(), { timeout })
      .catch(() => undefined);
    await page
      .getByRole('button', { name: 'Filtreler' })
      .or(page.getByText('Filtreler'))
      .first()
      .waitFor({ state: 'visible', timeout });
    await assertNotErrorPage(page);
    return;
  }
  if (readyWhen === 'main') {
    await page.locator('main, .roomio-page-stack').first().waitFor({ state: 'visible', timeout });
    await assertNotErrorPage(page);
    return;
  }
  await page.getByRole('heading', { level: 1 }).first().waitFor({ state: 'visible', timeout });
  await assertNotErrorPage(page);
}

/** Demo rolü ayarla, sayfaya git; kabuk hazır olana kadar bekle. */
export async function gotoWithDemo(
  page: Page,
  url: string,
  role: DemoRole = 'admin',
  opts?: { waitForSideNav?: boolean; readyWhen?: GotoReadyWhen },
) {
  await useDemoRole(page, role);
  const readyWhen = opts?.readyWhen ?? (opts?.waitForSideNav === false ? 'heading' : undefined);

  for (let attempt = 0; attempt < 2; attempt++) {
    try {
      await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 75_000 });
      if (readyWhen) {
        await waitForDemoPageReady(page, readyWhen);
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
      return;
    } catch (err) {
      if (attempt === 1) throw err;
      await page.waitForTimeout(1500);
    }
  }
}

/** Demo rolü + ilk sayfa yüklemesi (hub testleri için). */
export async function bootstrapDemoPage(page: Page, role: DemoRole = 'admin', url = '/') {
  await gotoWithDemo(page, url, role);
}
