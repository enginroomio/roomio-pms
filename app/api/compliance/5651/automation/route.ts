import { NextResponse } from 'next/server';
import { runHotspotAutomation } from '@/lib/integrations/hotspot5651/automation';
import { loadHotspot5651Config } from '@/lib/integrations/hotspot5651/server';

export async function GET() {
  const config = await loadHotspot5651Config();
  return NextResponse.json({
    enabled: config.automationEnabled,
    intervalMinutes: config.automationIntervalMinutes,
    lastRun: config.lastAutomationRun,
    autoSyncDevices: config.autoSyncDevices,
    autoProvisionInHouse: config.autoProvisionInHouse,
    autoTesaOnCheckIn: config.autoTesaOnCheckIn,
    autoCloseOnCheckOut: config.autoCloseOnCheckOut,
  });
}

export async function POST() {
  const result = await runHotspotAutomation();
  return NextResponse.json({ ok: result.errors.length === 0 || result.provisioned > 0 || result.synced.ingested > 0, result });
}
