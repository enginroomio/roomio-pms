import { ingestBridgeEvent } from '@/lib/integrations/hotspot5651/bridge';
import { roomToAuthUser } from '@/lib/integrations/hotspot5651/parsers';
import {
  addMikrotikHotspotUser,
  disconnectMikrotikActiveUser,
  listMikrotikActiveSessions,
  removeMikrotikHotspotUser,
  testMikrotikConnection,
} from '@/lib/integrations/hotspot5651/mikrotik';
import { loadHotspot5651Config } from '@/lib/integrations/hotspot5651/server';
import {
  authorizeUnifiGuest,
  listUnifiAccessPoints,
  listUnifiGuestStations,
  testUnifiConnection,
  unauthorizeUnifiGuest,
} from '@/lib/integrations/hotspot5651/unifi';
import type { DeviceTestResult } from '@/lib/integrations/hotspot5651/types';

export async function testNetworkDevices(device?: 'mikrotik' | 'unifi'): Promise<DeviceTestResult[]> {
  const config = await loadHotspot5651Config();
  const results: DeviceTestResult[] = [];
  if (!device || device === 'mikrotik') results.push(await testMikrotikConnection(config.mikrotik));
  if (!device || device === 'unifi') results.push(await testUnifiConnection(config.unifi));
  return results;
}

export async function provisionNetworkGuest(
  roomNo: string,
  guestName: string,
  password: string,
  checkOut?: string,
): Promise<{ mikrotik?: DeviceTestResult; unifi?: DeviceTestResult }> {
  const config = await loadHotspot5651Config();
  const authUser = roomToAuthUser(roomNo);
  const comment = `Roomio ${guestName} oda ${roomNo}`;
  const out: { mikrotik?: DeviceTestResult; unifi?: DeviceTestResult } = {};

  if (config.mikrotik.enabled) {
    out.mikrotik = await addMikrotikHotspotUser(config.mikrotik, authUser, password, comment);
  }
  if (config.unifi.enabled && checkOut) {
    const checkoutMs = new Date(checkOut).getTime() - Date.now();
    const minutes = Math.max(60, Math.ceil(checkoutMs / 60_000));
    out.unifi = await authorizeUnifiGuest(config.unifi, `ff:ff:ff:ff:${roomNo.padStart(2, '0')}:00`, minutes);
    void out.unifi;
  }

  return out;
}

export async function deprovisionNetworkGuest(roomNo: string): Promise<{
  mikrotik?: DeviceTestResult;
  closed?: DeviceTestResult;
}> {
  const config = await loadHotspot5651Config();
  const authUser = roomToAuthUser(roomNo);
  const out: { mikrotik?: DeviceTestResult; closed?: DeviceTestResult } = {};

  if (config.mikrotik.enabled) {
    out.closed = await disconnectMikrotikActiveUser(config.mikrotik, authUser);
    out.mikrotik = await removeMikrotikHotspotUser(config.mikrotik, authUser);
  }

  return out;
}

export async function syncDeviceSessions(): Promise<{
  ingested: number;
  mikrotik: number;
  unifi: number;
  aps: number;
}> {
  const config = await loadHotspot5651Config();
  let ingested = 0;
  let mikrotik = 0;
  let unifi = 0;

  if (config.mikrotik.enabled) {
    const sessions = await listMikrotikActiveSessions(config.mikrotik);
    mikrotik = sessions.length;
    for (const s of sessions) {
      const line = `<hotspot> user=${s.user} logged in ${s.address} ${s.macAddress}`;
      const res = await ingestBridgeEvent('mikrotik', { line });
      if (res.ok) ingested++;
    }
  }

  if (config.unifi.enabled) {
    const stations = await listUnifiGuestStations(config.unifi);
    unifi = stations.length;
    for (const sta of stations) {
      const line = `wifi connected guest_name=${sta.hostname || 'guest'} mac=${sta.mac} ip=${sta.ip}`;
      const res = await ingestBridgeEvent('unifi', { line });
      if (res.ok) ingested++;
    }
  }

  const aps = config.unifi.enabled ? (await listUnifiAccessPoints(config.unifi)).length : 0;
  return { ingested, mikrotik, unifi, aps };
}

export async function getDeviceStatus(): Promise<{
  mikrotik: DeviceTestResult;
  unifi: DeviceTestResult;
  accessPoints: Array<{ name: string; mac: string; model: string; state: number }>;
  activeMikrotik: number;
  activeUnifi: number;
}> {
  const config = await loadHotspot5651Config();
  const [mikrotik, unifi] = await Promise.all([
    testMikrotikConnection(config.mikrotik),
    testUnifiConnection(config.unifi),
  ]);
  const accessPoints = config.unifi.enabled ? await listUnifiAccessPoints(config.unifi) : [];
  const activeMikrotik = config.mikrotik.enabled ? (await listMikrotikActiveSessions(config.mikrotik)).length : 0;
  const activeUnifi = config.unifi.enabled ? (await listUnifiGuestStations(config.unifi)).length : 0;

  return { mikrotik, unifi, accessPoints, activeMikrotik, activeUnifi };
}
