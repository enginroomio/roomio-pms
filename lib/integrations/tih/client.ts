import { loadJsonConfig, saveJsonConfig } from '@/lib/integrations/_config-store';
import {
  callElektraService,
  isElektraRelayEnabled,
  loadElektraServerConfig,
} from '@/lib/integrations/elektra-server/client';
import { submitEgmToGateway, loadEgmConfig, type EgmNoticeType } from '@/lib/integrations/egm/client';
import { effectiveSimulateWhenOffline } from '@/lib/integrations/live-mode';
import {
  DEFAULT_TIH_CONFIG,
  type TihConfig,
  type TihGuestPayload,
  type TihSubmitResult,
} from '@/lib/integrations/tih/types';

const CONFIG_FILE = 'tih-config.json';

export async function loadTihConfig(): Promise<TihConfig> {
  return loadJsonConfig(CONFIG_FILE, DEFAULT_TIH_CONFIG);
}

export async function saveTihConfig(config: TihConfig): Promise<void> {
  await saveJsonConfig(CONFIG_FILE, config);
}

export async function submitTihEgm(
  guest: TihGuestPayload,
  config?: TihConfig,
  noticeType: EgmNoticeType = 'arrival',
): Promise<TihSubmitResult> {
  const cfg = config ?? (await loadTihConfig());
  if (!cfg.enabled) {
    return { ok: false, message: 'TIH (otomatik EGM) kapalı' };
  }
  const refPrefix = noticeType === 'departure' ? 'TIH-OUT' : 'TIH';

  const elektra = await loadElektraServerConfig();
  const facilityCode = cfg.facilityCode || elektra.hotelCode || loadEgmConfig().facilityCode;

  if (cfg.useElektraServer && isElektraRelayEnabled(elektra, 'tih')) {
    const result = await callElektraService('tih', 'egm-submit', {
      facilityCode,
      guest,
      noticeType,
      submittedAt: new Date().toISOString(),
    }, elektra);
    return {
      ok: result.ok,
      simulated: result.simulated,
      message: result.ok
        ? noticeType === 'departure'
          ? `TIH → EGM çıkış bildirimi Elektra sunucuya iletildi (Oda ${guest.roomNo})`
          : `TIH → EGM bildirimi Elektra sunucuya iletildi (Oda ${guest.roomNo})`
        : result.message,
      egmRef: result.ok ? `${refPrefix}-${Date.now().toString(36).toUpperCase()}` : undefined,
    };
  }

  // Doğrudan EGM gateway yedek yolu
  const egm = await submitEgmToGateway(guest, undefined, noticeType);
  if (egm.ok) {
    return {
      ok: true,
      simulated: egm.simulated,
      message: egm.message,
      egmRef: egm.egmRef,
    };
  }

  if (effectiveSimulateWhenOffline(cfg.simulateWhenOffline)) {
    return {
      ok: true,
      simulated: true,
      message: noticeType === 'departure'
        ? `[Simülasyon] TIH EGM çıkış — Oda ${guest.roomNo}`
        : `[Simülasyon] TIH EGM — Oda ${guest.roomNo}`,
      egmRef: `${refPrefix}-SIM-${Date.now().toString(36).toUpperCase()}`,
    };
  }

  return { ok: false, message: egm.message };
}

export async function testTihConnection(config = DEFAULT_TIH_CONFIG): Promise<TihSubmitResult> {
  return submitTihEgm({
    firstName: 'Test',
    lastName: 'Misafir',
    roomNo: '101',
    nationality: 'TR',
    idNo: '10000000146',
    idType: 'TCKN',
    birthDate: '1990-01-01',
    birthPlace: 'İstanbul',
    gender: 'E',
    fatherName: 'Test',
    motherName: 'Test',
    checkIn: new Date().toISOString().slice(0, 10),
    checkOut: new Date(Date.now() + 86400000).toISOString().slice(0, 10),
  }, config);
}
