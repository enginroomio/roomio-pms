import { NextResponse } from 'next/server';
import { getDeviceStatus, testNetworkDevices } from '@/lib/integrations/hotspot5651/devices';
import { loadPbxConfig, testPbxConnection } from '@/lib/integrations/pbx/client';
import { loadTesaConfig, testTesaConnection } from '@/lib/integrations/tesa/client';
import { isIntegrationLiveMode } from '@/lib/integrations/live-mode';

export const dynamic = 'force-dynamic';

export async function GET() {
  const [tesaConfig, tesaTest, pbxConfig, pbxTest, deviceStatus, deviceTests] = await Promise.all([
    loadTesaConfig(),
    testTesaConnection(),
    loadPbxConfig(),
    testPbxConnection(),
    getDeviceStatus(),
    testNetworkDevices(),
  ]);

  return NextResponse.json({
    ok: true,
    mode: isIntegrationLiveMode() ? 'live' : 'simulated',
    tesa: {
      enabled: tesaConfig.enabled,
      host: tesaConfig.host,
      port: tesaConfig.port,
      simulateWhenOffline: tesaConfig.simulateWhenOffline,
      connection: tesaTest,
    },
    pbx: {
      enabled: pbxConfig.enabled,
      model: pbxConfig.model,
      host: pbxConfig.host,
      port: pbxConfig.port,
      macAddress: pbxConfig.macAddress,
      simulateWhenOffline: pbxConfig.simulateWhenOffline,
      autoOnCheckIn: pbxConfig.autoOnCheckIn,
      autoOnCheckOut: pbxConfig.autoOnCheckOut,
      connection: pbxTest,
    },
    hotspot5651: {
      status: deviceStatus,
      tests: deviceTests,
    },
  });
}
