import { loadJsonConfig, saveJsonConfig } from '@/lib/integrations/_config-store';
import { DEFAULT_LOYALTY_CONFIG, type LoyaltyConfig } from '@/lib/integrations/loyalty/types';

const FILE = 'loyalty-config.json';

export async function loadLoyaltyConfig(): Promise<LoyaltyConfig> {
  return loadJsonConfig(FILE, DEFAULT_LOYALTY_CONFIG);
}

export async function saveLoyaltyConfig(config: LoyaltyConfig): Promise<void> {
  await saveJsonConfig(FILE, config);
}

export function calculateLoyaltyPoints(
  config: LoyaltyConfig,
  opts: { nights: number; spendTry: number; agencyCode?: string },
): { points: number; agencyBonus: number; tier?: string } {
  if (!config.enabled) return { points: 0, agencyBonus: 0 };
  const base = opts.nights * config.pointsPerNight + Math.floor(opts.spendTry / 100) * config.pointsPer100Try;
  const tier = [...config.tiers]
    .reverse()
    .find((t) => opts.nights >= t.minNights && opts.spendTry >= t.minSpend);
  const multiplier = tier?.bonusMultiplier ?? 1;
  const agency = config.agencyRules.find((r) => r.enabled && r.agencyCode === opts.agencyCode);
  const agencyBonus = agency ? Math.round(base * (agency.bonusPercent / 100)) : 0;
  return {
    points: Math.round(base * multiplier) + agencyBonus,
    agencyBonus,
    tier: tier?.name,
  };
}
