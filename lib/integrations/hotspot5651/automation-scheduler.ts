import { runHotspotAutomation } from '@/lib/integrations/hotspot5651/automation';
import { loadHotspot5651Config } from '@/lib/integrations/hotspot5651/server';

let timer: ReturnType<typeof setInterval> | null = null;
let started = false;

const AUTOMATION_SERVER =
  process.env.ROOMIO_AUTOMATION === '1' || process.env.NODE_ENV === 'production';

export function startServerHotspotAutomation(): void {
  if (!AUTOMATION_SERVER || started) return;
  started = true;

  // Sunucu açılışını yavaşlatmamak için ilk çalıştırmayı geciktir
  setTimeout(() => {
    timer = setInterval(() => {
      void tick();
    }, 60_000);
  }, 90_000);
}

async function tick(): Promise<void> {
  try {
    const config = await loadHotspot5651Config();
    if (!config.automationEnabled) return;

    const intervalMs = Math.max(1, config.automationIntervalMinutes) * 60_000;
    const last = config.lastAutomationRun ? new Date(config.lastAutomationRun).getTime() : 0;
    if (Date.now() - last < intervalMs) return;

    const result = await runHotspotAutomation();
    if (process.env.NODE_ENV !== 'production') {
      console.log('[roomio-automation]', JSON.stringify(result));
    }
  } catch (e) {
    console.error('[roomio-automation]', e);
  }
}
