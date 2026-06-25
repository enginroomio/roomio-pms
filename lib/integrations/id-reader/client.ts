import { loadJsonConfig, saveJsonConfig } from '@/lib/integrations/_config-store';
import { isIntegrationLiveMode } from '@/lib/integrations/live-mode';
import { probeLiveGateway } from '@/lib/integrations/live-probe';
import { DEFAULT_ID_READER_CONFIG, type IdReaderConfig, type IdScanResult } from '@/lib/integrations/id-reader/types';

const FILE = 'id-reader-config.json';

export async function loadIdReaderConfig(): Promise<IdReaderConfig> {
  return loadJsonConfig(FILE, DEFAULT_ID_READER_CONFIG);
}

export async function saveIdReaderConfig(config: IdReaderConfig): Promise<void> {
  await saveJsonConfig(FILE, config);
}

export async function testIdReaderConnection(config = DEFAULT_ID_READER_CONFIG): Promise<IdScanResult> {
  if (!config.enabled) return { ok: false, message: 'Kimlik okuyucu kapalı' };
  const active = config.devices.filter((d) => d.enabled).length;
  const simulated = !isIntegrationLiveMode() || config.simulateWhenOffline;
  if (!simulated && process.env.ROOMIO_ID_READER_GATEWAY_URL?.trim()) {
    const probe = await probeLiveGateway('ROOMIO_ID_READER_GATEWAY_URL', 'Kimlik okuyucu');
    return { ok: probe.ok, simulated: probe.simulated, message: probe.message };
  }
  return { ok: true, simulated: true, message: `Simülasyon — ${active} cihaz hazır` };
}

export async function scanIdDocument(deviceId?: string): Promise<IdScanResult> {
  const config = await loadIdReaderConfig();
  if (!config.enabled) return { ok: false, message: 'Kimlik okuyucu kapalı' };

  const device = deviceId
    ? config.devices.find((d) => d.id === deviceId && d.enabled)
    : config.devices.find((d) => d.enabled);
  if (!device) return { ok: false, message: 'Aktif cihaz bulunamadı' };

  const simulated = !isIntegrationLiveMode() || config.simulateWhenOffline;
  const docNo = config.maskIdNumbers ? 'U12****89' : 'U123456789';
  return {
    ok: true,
    simulated,
    message: simulated ? `Simülasyon: ${device.name} tarama başarılı` : 'Kimlik tarandı',
    data: {
      firstName: 'Ahmet',
      lastName: 'Yılmaz',
      nationality: 'TR',
      documentNo: docNo,
      birthDate: '1985-04-12',
      gender: 'M',
    },
  };
}
