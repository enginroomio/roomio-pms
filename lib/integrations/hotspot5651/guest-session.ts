import { roomToAuthUser } from '@/lib/integrations/hotspot5651/parsers';
import { deprovisionNetworkGuest, provisionNetworkGuest } from '@/lib/integrations/hotspot5651/devices';
import {
  appendHotspotLog,
  closeHotspotSessionsByRoom,
  loadHotspot5651Config,
  revokeGuestWifiCredential,
  saveGuestWifiCredential,
} from '@/lib/integrations/hotspot5651/server';
import type { HotspotSessionLog } from '@/lib/integrations/hotspot5651/types';

export type GuestSessionRequest = {
  action: 'open' | 'close';
  roomNo: string;
  guestName: string;
  reservationId?: string;
  checkOut?: string;
  guestIdType?: HotspotSessionLog['guestIdType'];
  guestIdRaw?: string;
};

function roomIp(roomNo: string): string {
  const n = parseInt(roomNo, 10) || 1;
  const floor = Math.floor(n / 100) || Math.floor(n / 10) || 1;
  const host = 100 + (n % 155);
  return `10.10.${floor}.${host}`;
}

export async function handleGuestHotspotSession(req: GuestSessionRequest): Promise<{
  ok: boolean;
  message: string;
  log?: HotspotSessionLog;
  closed?: number;
  authUser?: string;
  wifiPassword?: string;
  devices?: string[];
}> {
  const config = await loadHotspot5651Config();
  if (!config.enabled) {
    return { ok: false, message: '5651 hotspot loglama kapalı' };
  }

  const authUser = roomToAuthUser(req.roomNo);

  if (req.action === 'close') {
    const closed = await closeHotspotSessionsByRoom(req.roomNo);
    await revokeGuestWifiCredential(req.roomNo);
    const deviceResults = await deprovisionNetworkGuest(req.roomNo);
    const deviceMsgs: string[] = [];
    if (deviceResults.mikrotik?.message) deviceMsgs.push(deviceResults.mikrotik.message);
    if (deviceResults.closed?.message) deviceMsgs.push(deviceResults.closed.message);

    return {
      ok: true,
      message: [
        closed > 0 ? `${closed} WiFi oturumu kapatıldı` : 'Aktif WiFi oturumu yok',
        ...deviceMsgs,
      ].join(' · '),
      closed,
      authUser,
      devices: deviceMsgs,
    };
  }

  const wifiPassword = `R${req.roomNo}${new Date().getFullYear()}`;
  const expiresAt = req.checkOut
    ? new Date(`${req.checkOut}T23:59:59`).toISOString()
    : new Date(Date.now() + 7 * 86_400_000).toISOString();

  await saveGuestWifiCredential({
    roomNo: req.roomNo,
    authUser,
    password: wifiPassword,
    guestName: req.guestName,
    reservationId: req.reservationId ?? null,
    expiresAt,
  });

  const deviceResults = await provisionNetworkGuest(req.roomNo, req.guestName, wifiPassword, req.checkOut);
  const deviceMsgs: string[] = [];
  if (deviceResults.mikrotik?.message) {
    deviceMsgs.push(`MikroTik: ${deviceResults.mikrotik.message}${deviceResults.mikrotik.simulated ? ' (sim)' : ''}`);
  }

  const log = await appendHotspotLog({
    startedAt: new Date().toISOString(),
    endedAt: null,
    internalIp: roomIp(req.roomNo),
    internalPort: 0,
    externalIp: '0.0.0.0',
    externalPort: 0,
    macAddress: 'PENDING',
    bytesIn: 0,
    bytesOut: 0,
    guestName: req.guestName,
    guestIdType: req.guestIdType ?? 'room_guest',
    guestIdRaw: req.guestIdRaw ?? authUser,
    roomNo: req.roomNo,
    reservationId: req.reservationId ?? null,
    authUser,
    source: 'api',
    userAgent: null,
    hotspotZone: config.mikrotik.enabled ? `MikroTik/${config.mikrotik.hotspotServer}` : 'Guest-WiFi-PMS',
    provisioned: true,
  });

  return {
    ok: true,
    message: [`WiFi: ${authUser}`, ...deviceMsgs].join(' · '),
    log,
    authUser,
    wifiPassword,
    devices: deviceMsgs,
  };
}
