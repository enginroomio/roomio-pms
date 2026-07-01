import { test, expect } from '@playwright/test';
import { gotoWithDemo } from './helpers/demo-auth';

test.describe('Bulut yedekleme', () => {
  test('ayarlar sayfası yüklenir', async ({ page }) => {
    await gotoWithDemo(page, '/settings/integrations/cloud-backup', 'admin', {
      waitForSideNav: false,
      readyWhen: 'main',
    });
    await expect(page.getByRole('heading', { name: 'Veritabanı & Gün Sonu Yedekleme' })).toBeVisible({ timeout: 45_000 });
    await expect(page.getByRole('button', { name: 'Şimdi yedekle' })).toBeVisible();
  });

  test('manuel yedek API çalışır', async ({ page }) => {
    await gotoWithDemo(page, '/settings/integrations/cloud-backup', 'admin', {
      waitForSideNav: false,
      readyWhen: 'main',
    });
    const backupOk = await page.evaluate(async () => {
      const role = localStorage.getItem('roomio-demo-role') ?? 'admin';
      const r = await fetch('/api/cloud-backup/run', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-roomio-demo-role': role,
        },
        credentials: 'include',
        body: '{}',
      });
      const j = (await r.json()) as { ok?: boolean };
      return r.ok && j.ok;
    });
    expect(backupOk).toBeTruthy();
  });

  test('gün sonu yedek sekmesi', async ({ page }) => {
    await gotoWithDemo(page, '/reports?tab=eod&action=backup', 'admin', {
      waitForSideNav: false,
      readyWhen: 'main',
    });
    await expect(page.getByRole('button', { name: 'Yedek al' })).toBeVisible({ timeout: 45_000 });
    await expect(page.getByRole('link', { name: 'Bulut yedek ayarları' })).toBeVisible();
  });

  test('yedek indirme linki', async ({ page }) => {
    await gotoWithDemo(page, '/settings/integrations/cloud-backup', 'admin', {
      waitForSideNav: false,
      readyWhen: 'main',
    });
    const runId = await page.evaluate(async () => {
      const role = localStorage.getItem('roomio-demo-role') ?? 'admin';
      const r = await fetch('/api/cloud-backup/run', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-roomio-demo-role': role,
        },
        credentials: 'include',
        body: '{}',
      });
      const j = (await r.json()) as { runId?: string };
      return j.runId ?? null;
    });
    expect(runId).toBeTruthy();

    await page.waitForFunction(
      async (expectedRunId) => {
        const role = localStorage.getItem('roomio-demo-role') ?? 'admin';
        const r = await fetch('/api/cloud-backup/history?limit=20', {
          headers: { 'x-roomio-demo-role': role },
          credentials: 'include',
        });
        if (!r.ok) return false;
        const j = (await r.json()) as { runs?: { id: string; status: string; localPath?: string }[] };
        const run = j.runs?.find((x) => x.id === expectedRunId);
        return run?.status === 'ok' && Boolean(run.localPath);
      },
      runId,
      { timeout: 60_000 },
    );

    await page.reload({ waitUntil: 'domcontentloaded' });
    await expect(page.getByRole('link', { name: 'İndir' }).first()).toBeVisible({ timeout: 45_000 });
  });
});
