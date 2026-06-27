import { test, expect } from '@playwright/test';

/** Elektra menü hub panelleri — smoke (HTTP 200 + başlık). */
const HUBS = [
  { path: '/?hub=panel', title: /Panel merkezi/i },
  { path: '/reservations?hub=rezervasyon', title: /Rezervasyon [Mm]erkezi/i },
  { path: '/reception?hub=resepsiyon', title: /Resepsiyon [Mm]erkezi/i },
  { path: '/reception?hub=onkasa', title: /Ön [Kk]asa [Mm]erkezi/i },
  { path: '/housekeeping?hub=kat', title: /Kat [Hh]izmetleri [Mm]erkezi/i },
  { path: '/guest-relations?hub=misafir', title: /Misafir [İi]lişkileri [Mm]erkezi/i },
  { path: '/fnb?hub=banket', title: /Banket [Mm]erkezi/i },
  { path: '/accounting?hub=arkaburo', title: /Arka [Bb]üro/i },
  { path: '/reports?hub=raporlar', title: /Raporlar [Mm]erkezi/i },
  { path: '/reports?hub=gunsonu', title: /Gün [Ss]onu [Mm]erkezi/i },
  { path: '/settings?hub=ayarlar', title: /Ayarlar ve Kısayollar/i },
  { path: '/settings?hub=sistem', title: /Sistem Merkezi/i },
] as const;

test.describe('Elektra menü hub panelleri', () => {
  for (const hub of HUBS) {
    test(`${hub.path} — hub yüklenir`, async ({ page }) => {
      const res = await page.goto(hub.path);
      expect(res?.ok()).toBeTruthy();
      await expect(page.getByRole('heading', { name: hub.title }).first()).toBeVisible({ timeout: 15_000 });
    });
  }
});
