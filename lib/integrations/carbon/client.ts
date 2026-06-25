import { loadJsonConfig, saveJsonConfig } from '@/lib/integrations/_config-store';
import { DEFAULT_CARBON_CONFIG, type CarbonConfig, type CarbonOffsetQuote } from '@/lib/integrations/carbon/types';

const FILE = 'carbon-config.json';

export async function loadCarbonConfig(): Promise<CarbonConfig> {
  return loadJsonConfig(FILE, DEFAULT_CARBON_CONFIG);
}

export async function saveCarbonConfig(config: CarbonConfig): Promise<void> {
  await saveJsonConfig(FILE, config);
}

export async function quoteCarbonOffset(nights: number): Promise<CarbonOffsetQuote> {
  const config = await loadCarbonConfig();
  if (!config.enabled) return { ok: false, nights, totalCo2Kg: 0, offsetCost: 0, currency: config.currency };
  const totalCo2Kg = Math.round(nights * config.co2PerNightKg * 10) / 10;
  const offsetCost = Math.round(totalCo2Kg * config.offsetCostPerKg * 100) / 100;
  return {
    ok: true,
    nights,
    totalCo2Kg,
    offsetCost,
    currency: config.currency,
    certificatePreview: `${config.certificateProvider} — ${totalCo2Kg} kg CO₂`,
  };
}

export async function getPublicCarbonInfo() {
  const config = await loadCarbonConfig();
  return {
    ok: config.enabled,
    co2PerNightKg: config.co2PerNightKg,
    offsetCostPerKg: config.offsetCostPerKg,
    currency: config.currency,
    autoOfferOnBooking: config.autoOfferOnBooking,
    showGuestBadge: config.showGuestBadge,
    provider: config.certificateProvider,
  };
}
