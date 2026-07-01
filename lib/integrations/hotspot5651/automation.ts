import { getAllReservationsServer } from '@/lib/server/pms-store';
import { syncDeviceSessions } from '@/lib/integrations/hotspot5651/devices';
import { handleGuestHotspotSession } from '@/lib/integrations/hotspot5651/guest-session';
import {
  loadHotspot5651Config,
  loadHotspot5651Credentials,
  saveHotspot5651Config,
} from '@/lib/integrations/hotspot5651/server';
import { encodeGuestKey } from '@/lib/integrations/tesa/client';
import { checkoutGuest } from '@/lib/integrations/tesa/client';
import { loadPbxConfig, pbxCheckIn, pbxCheckOut } from '@/lib/integrations/pbx/client';
import type { PbxActionResult } from '@/lib/integrations/pbx/types';

export type AutomationRunResult = {
  at: string;
  provisioned: number;
  closed: number;
  synced: { ingested: number; mikrotik: number; unifi: number };
  departuresProcessed: number;
  errors: string[];
};

let automationRunning = false;

export async function runHotspotAutomation(): Promise<AutomationRunResult> {
  if (automationRunning) {
    return {
      at: new Date().toISOString(),
      provisioned: 0,
      closed: 0,
      synced: { ingested: 0, mikrotik: 0, unifi: 0 },
      departuresProcessed: 0,
      errors: ['Önceki otomasyon hâlâ çalışıyor'],
    };
  }

  automationRunning = true;
  try {
    return await runHotspotAutomationInner();
  } finally {
    automationRunning = false;
  }
}

async function runHotspotAutomationInner(): Promise<AutomationRunResult> {
  const config = await loadHotspot5651Config();
  const result: AutomationRunResult = {
    at: new Date().toISOString(),
    provisioned: 0,
    closed: 0,
    synced: { ingested: 0, mikrotik: 0, unifi: 0 },
    departuresProcessed: 0,
    errors: [],
  };

  if (!config.enabled || !config.automationEnabled) {
    result.errors.push('Otomasyon kapalı');
    return result;
  }

  if (config.autoProvisionInHouse) {
    const credentials = await loadHotspot5651Credentials();
    const credByRoom = new Map(credentials.map((c) => [c.roomNo, c]));
    const inHouse = (await getAllReservationsServer()).filter((r) => r.status === 'CHECKED_IN' && r.roomNo);

    for (const guest of inHouse) {
      const existing = credByRoom.get(guest.roomNo!);
      if (existing && new Date(existing.expiresAt).getTime() > Date.now()) continue;
      try {
        const res = await handleGuestHotspotSession({
          action: 'open',
          roomNo: guest.roomNo!,
          guestName: guest.guestName,
          reservationId: guest.id,
          checkOut: guest.checkOut,
        });
        if (res.ok) result.provisioned++;
        else result.errors.push(`Provizyon ${guest.roomNo}: ${res.message}`);
      } catch (e) {
        result.errors.push(`Provizyon ${guest.roomNo}: ${e instanceof Error ? e.message : 'hata'}`);
      }
    }
  }

  if (config.autoSyncDevices) {
    try {
      const sync = await syncDeviceSessions();
      result.synced = sync;
    } catch (e) {
      result.errors.push(`Senkron: ${e instanceof Error ? e.message : 'hata'}`);
    }
  }

  // Çıkış günü 23:59'u geçmiş ama hâlâ "active" kalan WiFi bilgileri — manuel check-out
  // yapılmamış olsa bile süresi geçen misafirleri otomatik olarak sistemden düşür.
  if (config.autoCloseOnCheckOut) {
    const expiredCredentials = (await loadHotspot5651Credentials()).filter(
      (c) => c.active && new Date(c.expiresAt).getTime() <= Date.now(),
    );
    for (const cred of expiredCredentials) {
      try {
        const res = await handleGuestHotspotSession({
          action: 'close',
          roomNo: cred.roomNo,
          guestName: cred.guestName,
          reservationId: cred.reservationId ?? undefined,
        });
        if (res.ok) result.closed += res.closed ?? 1;
        else result.errors.push(`Süre dolumu ${cred.roomNo}: ${res.message}`);
      } catch (e) {
        result.errors.push(`Süre dolumu ${cred.roomNo}: ${e instanceof Error ? e.message : 'hata'}`);
      }
    }
  }

  await saveHotspot5651Config({
    ...config,
    lastAutomationRun: result.at,
  });

  return result;
}

export type AutomatedCheckInRequest = {
  reservationId: string;
  roomNo: string;
  guestName: string;
  checkIn: string;
  checkOut: string;
  reservationRef: string;
  tesa?: boolean;
  hotspot?: boolean;
  pbx?: boolean;
};

export async function performAutomatedCheckIn(req: AutomatedCheckInRequest): Promise<{
  ok: boolean;
  tesa?: { ok: boolean; message: string; simulated?: boolean };
  pbx?: PbxActionResult;
  hotspot?: Awaited<ReturnType<typeof handleGuestHotspotSession>>;
  messages: string[];
}> {
  const [config, pbxConfig] = await Promise.all([
    loadHotspot5651Config(),
    loadPbxConfig(),
  ]);
  const doTesa = req.tesa ?? config.autoTesaOnCheckIn;
  const doHotspot = req.hotspot ?? config.autoOpenOnCheckIn;
  const doPbx = req.pbx ?? pbxConfig.autoOnCheckIn;
  const messages: string[] = [];
  let tesaResult: { ok: boolean; message: string; simulated?: boolean } | undefined;
  let pbxResult: PbxActionResult | undefined;
  let hotspotResult: Awaited<ReturnType<typeof handleGuestHotspotSession>> | undefined;

  if (doTesa) {
    tesaResult = await encodeGuestKey({
      roomNo: req.roomNo,
      guestName: req.guestName,
      checkIn: req.checkIn,
      checkOut: req.checkOut,
      reservationRef: req.reservationRef,
      keyCount: 1,
    });
    messages.push(`TESA: ${tesaResult.message}`);
    if (!tesaResult.ok) {
      return { ok: false, tesa: tesaResult, pbx: pbxResult, messages };
    }
  }

  if (doPbx && pbxConfig.enabled) {
    pbxResult = await pbxCheckIn({
      roomNo: req.roomNo,
      guestName: req.guestName,
      checkIn: req.checkIn,
      checkOut: req.checkOut,
    }, pbxConfig);
    messages.push(`Santral: ${pbxResult.message}`);
    if (!pbxResult.ok) {
      return { ok: false, tesa: tesaResult, pbx: pbxResult, messages };
    }
  }

  if (doHotspot) {
    hotspotResult = await handleGuestHotspotSession({
      action: 'open',
      roomNo: req.roomNo,
      guestName: req.guestName,
      reservationId: req.reservationId,
      checkOut: req.checkOut,
    });
    messages.push(`WiFi: ${hotspotResult.message}`);
    if (hotspotResult.wifiPassword) {
      messages.push(`Şifre: ${hotspotResult.wifiPassword}`);
    }
  }

  return {
    ok: true,
    tesa: tesaResult,
    pbx: pbxResult,
    hotspot: hotspotResult,
    messages,
  };
}

export type AutomatedCheckOutRequest = {
  roomNo: string;
  guestName: string;
  reservationId?: string;
  pbx?: boolean;
};

export async function performAutomatedCheckOut(req: AutomatedCheckOutRequest): Promise<{
  ok: boolean;
  tesa?: { ok: boolean; message: string };
  pbx?: PbxActionResult;
  hotspot?: Awaited<ReturnType<typeof handleGuestHotspotSession>>;
  messages: string[];
}> {
  const [config, pbxConfig] = await Promise.all([
    loadHotspot5651Config(),
    loadPbxConfig(),
  ]);
  const messages: string[] = [];

  const tesaResult = await checkoutGuest(req.roomNo);
  messages.push(`TESA: ${tesaResult.message}`);

  let pbxResult: PbxActionResult | undefined;
  const doPbx = req.pbx ?? pbxConfig.autoOnCheckOut;
  if (doPbx && pbxConfig.enabled) {
    pbxResult = await pbxCheckOut(req.roomNo, pbxConfig);
    messages.push(`Santral: ${pbxResult.message}`);
  }

  let hotspotResult: Awaited<ReturnType<typeof handleGuestHotspotSession>> | undefined;
  if (config.autoCloseOnCheckOut) {
    hotspotResult = await handleGuestHotspotSession({
      action: 'close',
      roomNo: req.roomNo,
      guestName: req.guestName,
      reservationId: req.reservationId,
    });
    messages.push(`WiFi: ${hotspotResult.message}`);
  }

  return { ok: true, tesa: tesaResult, pbx: pbxResult, hotspot: hotspotResult, messages };
}
