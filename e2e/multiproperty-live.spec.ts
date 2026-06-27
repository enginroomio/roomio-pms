import { test, expect } from '@playwright/test';
import { authedGetAsAdmin, authHeaders, loginAdminToken } from './helpers/api-auth';

test.describe('Çoklu şube — canlı veri', () => {
  test('properties API iki şehir döner', async ({ request }) => {
    const res = await authedGetAsAdmin(request, '/api/properties');
    expect(res.ok()).toBeTruthy();
    const j = (await res.json()) as { properties: Array<{ id: string; city: string | null }> };
    expect(j.properties.length).toBeGreaterThanOrEqual(2);
    expect(j.properties.some((p) => p.city === 'İstanbul')).toBeTruthy();
    expect(j.properties.some((p) => p.city === 'Antalya')).toBeTruthy();
  });

  test('şube header ile dashboard propertyId değişir', async ({ request }) => {
    const token = await loginAdminToken(request);
    const headers = authHeaders(token);

    const props = ((await (await authedGetAsAdmin(request, '/api/properties')).json()) as {
      properties: Array<{ id: string; city: string; totalRooms?: number }>;
    }).properties;
    const ist = props.find((p) => p.city === 'İstanbul');
    const ant = props.find((p) => p.city === 'Antalya');
    expect(ist).toBeTruthy();
    expect(ant).toBeTruthy();

    const istDash = await request.get('/api/dashboard', {
      headers: { ...headers, 'x-roomio-property': ist!.id },
    });
    let antDash = await request.get('/api/dashboard', {
      headers: { ...headers, 'x-roomio-property': ant!.id },
    });
    if (!antDash.ok()) {
      await new Promise((r) => setTimeout(r, 2000));
      antDash = await request.get('/api/dashboard', {
        headers: { ...headers, 'x-roomio-property': ant!.id },
      });
    }
    expect(istDash.ok()).toBeTruthy();
    expect(antDash.ok()).toBeTruthy();

    const istJ = (await istDash.json()) as { propertyId: string; totalRooms: number; inHouse: number };
    const antJ = (await antDash.json()) as { propertyId: string; totalRooms: number; inHouse: number };

    expect(istJ.propertyId).toBe(ist!.id);
    expect(antJ.propertyId).toBe(ant!.id);

    const istMeta = props.find((p) => p.id === ist!.id)!;
    const antMeta = props.find((p) => p.id === ant!.id)!;
    expect(istMeta.city).not.toBe(antMeta.city);
  });

  test('konsolide rapor her iki şubeyi içerir', async ({ request }) => {
    const token = await loginAdminToken(request);
    const res = await request.get('/api/reports/consolidated', { headers: authHeaders(token) });
    expect(res.ok()).toBeTruthy();
    const j = (await res.json()) as {
      properties: Array<{ city: string | null; checkedIn: number }>;
      totals: { properties: number };
    };
    expect(j.totals.properties).toBeGreaterThanOrEqual(2);
    expect(j.properties.some((p) => p.city === 'İstanbul')).toBeTruthy();
    expect(j.properties.some((p) => p.city === 'Antalya')).toBeTruthy();
  });

  test('rezervasyon listesi şube bazlı filtrelenir', async ({ request }) => {
    const token = await loginAdminToken(request);
    const headers = authHeaders(token);
    const props = ((await (await authedGetAsAdmin(request, '/api/properties')).json()) as {
      properties: Array<{ id: string; city: string; totalRooms?: number }>;
    }).properties;
    const ist = props.find((p) => p.city === 'İstanbul')!;
    const ant = props.find((p) => p.city === 'Antalya')!;
    expect(ist).toBeTruthy();
    expect(ant).toBeTruthy();

    await request.get('/api/dashboard', { headers: { ...headers, 'x-roomio-property': ant.id } });

    const istRes = await request.get('/api/reservations', {
      headers: { ...headers, 'x-roomio-property': ist.id },
    });
    const antRes = await request.get('/api/reservations', {
      headers: { ...headers, 'x-roomio-property': ant.id },
    });
    expect(istRes.ok()).toBeTruthy();
    expect(antRes.ok()).toBeTruthy();

    const istJ = (await istRes.json()) as { reservations: Array<{ refNo?: string }> };
    const antJ = (await antRes.json()) as { reservations: Array<{ refNo?: string }> };

    expect(istJ.reservations.length).toBeGreaterThan(0);
    expect(antJ.reservations.length).toBeGreaterThan(0);
    expect(antJ.reservations.some((r) => r.refNo?.startsWith('RSV-ANT'))).toBeTruthy();
    expect(istJ.reservations.some((r) => r.refNo?.startsWith('RSV-ANT'))).toBeFalsy();
  });
});
